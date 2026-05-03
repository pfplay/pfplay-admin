import { z } from "zod"

export const RetireAvatarRequestSchema = z.object({
  reason: z
    .string()
    .min(1)
    .max(1000)
    .refine((s) => s.trim().length >= 1, "reason은 공백만으로 채울 수 없습니다"),
})
export type RetireAvatarRequest = z.infer<typeof RetireAvatarRequestSchema>
