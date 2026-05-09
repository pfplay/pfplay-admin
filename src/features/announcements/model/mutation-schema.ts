import { z } from "zod"

// `<input type="datetime-local">` 의 value 는 "YYYY-MM-DDTHH:mm" (초 생략) — backend
// LocalDateTime 와 호환. 빈 문자열은 null 로 정규화하여 schema 입력으로 보낸다.
const ISO_LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/

const datetimeLocalNullable = z
  .string()
  .regex(ISO_LOCAL, "유효한 일시 형식이 아닙니다")
  .nullable()

const baseSchema = z.object({
  type: z.enum(["MAINTENANCE_NOTICE", "EVENT", "EMERGENCY"]),
  severity: z.enum(["INFO", "WARN", "CRITICAL"]),
  titleKo: z.string().min(1, "한국어 제목은 필수입니다").max(200, "200자 이내"),
  titleEn: z.string().min(1, "영문 제목은 필수입니다").max(200, "200자 이내"),
  messageKo: z.string().min(1, "한국어 본문은 필수입니다").max(2000, "2000자 이내"),
  messageEn: z.string().min(1, "영문 본문은 필수입니다").max(2000, "2000자 이내"),
  scheduledStartAt: datetimeLocalNullable,
  scheduledEndAt: datetimeLocalNullable,
  expiresAt: datetimeLocalNullable,
})

// type 별 schedule 필드 분기 검증.
// - MAINTENANCE_NOTICE: scheduledStartAt + scheduledEndAt 필수, end > start, start > now,
//   expiresAt 사용 안 함
// - EVENT / EMERGENCY: schedule 필드 사용 안 함, expiresAt optional
//
// 서버 측 ANN-003 INVALID_SCHEDULE_FOR_TYPE / ANN-004 INVALID_SCHEDULE_WINDOW /
// ANN-005 SCHEDULED_START_IN_PAST 와 의미 일치. 클라이언트 시계 기반 사전 검증이라
// 서버가 자체 시계로 ANN-005 던질 수 있고, 그 경우 mutationErrorToast 가 처리한다.
export const createAnnouncementRequestSchema = baseSchema.superRefine((val, ctx) => {
  const isMaintenance = val.type === "MAINTENANCE_NOTICE"

  if (isMaintenance) {
    if (!val.scheduledStartAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scheduledStartAt"],
        message: "점검 시작 시각은 필수입니다",
      })
    }
    if (!val.scheduledEndAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scheduledEndAt"],
        message: "점검 종료 시각은 필수입니다",
      })
    }
    if (val.expiresAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expiresAt"],
        message: "점검 공지에는 만료 시각을 지정할 수 없습니다",
      })
    }
    if (val.scheduledStartAt && val.scheduledEndAt) {
      const startMs = new Date(val.scheduledStartAt).getTime()
      const endMs = new Date(val.scheduledEndAt).getTime()
      if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs <= startMs) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["scheduledEndAt"],
          message: "종료 시각은 시작 시각 이후여야 합니다",
        })
      }
    }
    if (val.scheduledStartAt) {
      const startMs = new Date(val.scheduledStartAt).getTime()
      if (Number.isFinite(startMs) && startMs <= Date.now()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["scheduledStartAt"],
          message: "시작 시각은 현재 이후여야 합니다",
        })
      }
    }
  } else {
    if (val.scheduledStartAt || val.scheduledEndAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scheduledStartAt"],
        message: "이 공지 종류에는 점검 시간을 지정할 수 없습니다",
      })
    }
  }
})

export type CreateAnnouncementRequest = z.infer<typeof createAnnouncementRequestSchema>
