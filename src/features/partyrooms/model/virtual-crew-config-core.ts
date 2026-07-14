import { z } from "zod"
import type { VirtualCrewStatus } from "@/entities/virtual-crew"

// 가상 DJ config 의 공통 필드/검증 코어 (bulk §5.2 ↔ per-room §5.3 공유).
//   status @NotNull VirtualCrewStatus{OFF, MANAGED}
//   targetCount Integer? — MANAGED 일 때 필수 ≥1 (총 봇 수), 그 외엔 무시(null)
//   djBotCount Integer? — MANAGED 일 때 필수 ≥0 (크루=DJ 역할 봇 수, 나머지는 리스너). targetCount 이하여야 함. 그 외엔 무시(null)
//   songPackId Long? — MANAGED 일 때 필수(nullable 스키마이나 UI 검증으로 필수화). null 이면 봇이
//     곡을 못 틀고 reconcile SKIP_NO_SONG_PACK 로 아예 배치 안 됨 → "운영중인데 봇 0" 함정 차단.
export const VirtualCrewStatusEnum = z.enum(["OFF", "MANAGED"])

// 컴파일 타임 안전장치 — entities VirtualCrewStatus 와 enum 이 어긋나면 타입 에러
type _AssertStatusMatch = VirtualCrewStatus extends z.infer<typeof VirtualCrewStatusEnum>
  ? z.infer<typeof VirtualCrewStatusEnum> extends VirtualCrewStatus
    ? true
    : never
  : never
const _statusMatch: _AssertStatusMatch = true
void _statusMatch

// status/target/djBot/songPack — bulk 와 per-room 이 공유하는 config 필드
export const virtualCrewConfigShape = {
  status: VirtualCrewStatusEnum,
  targetCount: z.number().int().min(1).nullable(),
  djBotCount: z.number().int().min(0).nullable(),
  songPackId: z.number().int().nullable(),
} as const

// MANAGED 일 때 targetCount/djBotCount 필수 — superRefine 으로 공유.
//   또한 djBotCount(DJ 역할 봇) 는 targetCount(총 봇) 이하여야 함 (backend djBotCount>targetCount → 400).
//   ※ djBotCount>재생가능트랙수 도 backend 400 이지만, 프론트는 트랙 수를 모르므로 검증하지 않음.
export function applyManagedConditional(
  val: {
    status: z.infer<typeof VirtualCrewStatusEnum>
    targetCount: number | null
    djBotCount: number | null
    songPackId: number | null
  },
  ctx: z.RefinementCtx,
): void {
  if (val.status !== "MANAGED") return
  if (val.targetCount === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["targetCount"],
      message: "운영중일 때 목표 인원은 필수입니다 (1 이상)",
    })
  }
  if (val.songPackId === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["songPackId"],
      message: "운영중일 때 송팩은 필수입니다 (없으면 봇이 배치되지 않음)",
    })
  }
  if (val.djBotCount === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["djBotCount"],
      message: "운영중일 때 DJ 봇 수는 필수입니다 (0 이상)",
    })
  }
  if (
    val.targetCount !== null &&
    val.djBotCount !== null &&
    val.djBotCount > val.targetCount
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["djBotCount"],
      message: "DJ 봇 수는 총 봇 수(목표 인원) 이하여야 합니다",
    })
  }
}
