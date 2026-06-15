import { z } from "zod"

// backend ChatConfig (가상 DJ 채팅/자가갱신 런타임 설정):
//   chatEnabled / selfUpdateEnabled boolean,
//   probabilityPercent int 0–100, cooldownSeconds / contextSize / outputMaxTokens int ≥1.
export const chatConfigSchema = z.object({
  chatEnabled: z.boolean(),
  selfUpdateEnabled: z.boolean(),
  probabilityPercent: z
    .number()
    .int("정수여야 합니다")
    .min(0, "0 이상이어야 합니다")
    .max(100, "100 이하여야 합니다"),
  cooldownSeconds: z
    .number()
    .int("정수여야 합니다")
    .min(1, "1 이상이어야 합니다"),
  contextSize: z.number().int("정수여야 합니다").min(1, "1 이상이어야 합니다"),
  outputMaxTokens: z
    .number()
    .int("정수여야 합니다")
    .min(1, "1 이상이어야 합니다"),
})

export type ChatConfig = z.infer<typeof chatConfigSchema>
