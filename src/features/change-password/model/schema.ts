import { z } from "zod"

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{10,128}$/

export const changePasswordSchema = z
  .object({
    // 정책 변경 이전 발급된 임시 비밀번호 호환을 위해 min(8) 유지 (백엔드 ChangeAdminPasswordRequest는 @NotBlank만 요구)
    currentPassword: z.string().min(8, "8자 이상").max(128),
    newPassword: z
      .string()
      .regex(PASSWORD_REGEX, "10자 이상, 대/소문자, 숫자, 특수문자(!@#$%^&*) 각 1개 이상"),
    newPasswordConfirm: z.string(),
  })
  .refine((d) => d.newPassword === d.newPasswordConfirm, {
    path: ["newPasswordConfirm"],
    message: "새 비밀번호와 일치하지 않습니다",
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ["newPassword"],
    message: "현재 비밀번호와 달라야 합니다",
  })

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>
