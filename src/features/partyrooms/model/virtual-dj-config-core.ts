import { z } from "zod"
import type { VirtualDjStatus } from "@/entities/virtual-dj"

// 가상 DJ config 의 공통 필드/검증 코어 (bulk §5.2 ↔ per-room §5.3 공유).
//   status @NotNull VirtualDjStatus{OFF, MANAGED, FROZEN}
//   targetCount Integer? — MANAGED 일 때 필수 ≥1, 그 외엔 무시(null)
//   companionFloor Integer? — MANAGED 일 때 필수 ≥0, 그 외엔 무시(null)
//   songPackId Long? — 항상 선택(nullable). MANAGED + null 이면 봇이 곡을 못 틈(reconcile SKIP_NO_SONG_PACK)
export const VirtualDjStatusEnum = z.enum(["OFF", "MANAGED", "FROZEN"])

// 컴파일 타임 안전장치 — entities VirtualDjStatus 와 enum 이 어긋나면 타입 에러
type _AssertStatusMatch = VirtualDjStatus extends z.infer<typeof VirtualDjStatusEnum>
  ? z.infer<typeof VirtualDjStatusEnum> extends VirtualDjStatus
    ? true
    : never
  : never
const _statusMatch: _AssertStatusMatch = true
void _statusMatch

// status/target/floor/songPack — bulk 와 per-room 이 공유하는 config 필드
export const virtualDjConfigShape = {
  status: VirtualDjStatusEnum,
  targetCount: z.number().int().min(1).nullable(),
  companionFloor: z.number().int().min(0).nullable(),
  songPackId: z.number().int().nullable(),
} as const

// MANAGED 일 때 target/floor 필수 — superRefine 으로 공유
export function applyManagedConditional(
  val: { status: z.infer<typeof VirtualDjStatusEnum>; targetCount: number | null; companionFloor: number | null },
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
  if (val.companionFloor === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["companionFloor"],
      message: "운영중일 때 최소 동행 인원은 필수입니다 (0 이상)",
    })
  }
}
