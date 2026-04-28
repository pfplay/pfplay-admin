import { z } from "zod"

export const TerminateReasonSchema = z.object({
  reason: z.string().min(1, "사유를 입력해주세요").max(500),
})
export type TerminateRequest = z.infer<typeof TerminateReasonSchema>

export const SuspendReasonSchema = TerminateReasonSchema
export type SuspendRequest = z.infer<typeof SuspendReasonSchema>

// backend §2.2 ground-truth mirror — UpdatePartyroomMetaRequest:
//   title @Size(max=100), introduction @Size(max=500), playbackTimeLimit @Min(1) @Max(60),
//   @AssertTrue isAtLeastOnePresent("최소 1개 필드는 변경 필요").
// .int()는 backend Integer 타입을 zod 단에서 enforce — annotation 1:1 mirror가 아니라 타입 정합성 확장.
export const UpdatePartyroomMetaSchema = z
  .object({
    title: z.string().min(1).max(100).optional(),
    introduction: z.string().max(500).optional(),
    playbackTimeLimit: z.coerce.number().int().min(1).max(60).optional(),
  })
  .refine(
    (v) =>
      v.title !== undefined ||
      v.introduction !== undefined ||
      v.playbackTimeLimit !== undefined,
    { message: "최소 1개 필드는 변경 필요" },
  )
export type UpdatePartyroomMetaRequest = z.infer<typeof UpdatePartyroomMetaSchema>
