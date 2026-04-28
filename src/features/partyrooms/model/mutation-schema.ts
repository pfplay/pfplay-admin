import { z } from "zod"

export const TerminateReasonSchema = z.object({
  reason: z.string().min(1, "사유를 입력해주세요").max(500),
})
export type TerminateRequest = z.infer<typeof TerminateReasonSchema>

export const SuspendReasonSchema = TerminateReasonSchema
export type SuspendRequest = z.infer<typeof SuspendReasonSchema>
