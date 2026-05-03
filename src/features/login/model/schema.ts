import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("이메일 형식이 올바르지 않습니다").max(255),
  password: z.string().min(8, "8자 이상 입력해주세요").max(128),
})

export type LoginFormValues = z.infer<typeof loginSchema>
