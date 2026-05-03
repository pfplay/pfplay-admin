import { z } from "zod"

// backend: CreateAdministratorRequest { email @NotBlank @Email @Size(max=255), nickname @NotBlank @Size(max=64), includeMemberProfile Boolean? }
//   - 신규 어드민은 항상 ADMIN role로 생성됨 (SUPER_ADMIN 승격은 별도 manual / DB 작업)
//   - 비밀번호는 backend가 자동 생성하여 응답 tempPassword 필드로 노출
//   - includeMemberProfile null/미전송 시 backend default true (Decision 8)
export const createAdministratorRequestSchema = z.object({
  email: z.string().min(1, "이메일은 필수입니다").email("이메일 형식이 아닙니다").max(255),
  nickname: z.string().min(1, "닉네임은 필수입니다").max(64),
  includeMemberProfile: z.boolean().optional(),
})
export type CreateAdministratorRequest = z.infer<typeof createAdministratorRequestSchema>

// backend: UpdateAdministratorRequest { nickname @NotBlank @Size(max=64) }
export const updateAdministratorRequestSchema = z.object({
  nickname: z.string().min(1, "닉네임은 필수입니다").max(64),
})
export type UpdateAdministratorRequest = z.infer<typeof updateAdministratorRequestSchema>

// backend: AttachMemberProfileRequest { nickname @NotBlank @Size(max=64) }
export const attachMemberProfileRequestSchema = z.object({
  nickname: z.string().min(1, "닉네임은 필수입니다").max(64),
})
export type AttachMemberProfileRequest = z.infer<typeof attachMemberProfileRequestSchema>
