import { z } from "zod"

// backend: GET /api/v1/admin/system/administrators?role={SUPER_ADMIN|ADMIN}&includeRevoked={boolean}
// role 미지정 시 전체. includeRevoked default false (backend가 default 처리).

export const AdminRoleEnum = z.enum(["SUPER_ADMIN", "ADMIN"])

export const administratorListQuerySchema = z.object({
  role: AdminRoleEnum.optional(),
  includeRevoked: z.boolean().optional(),
})

export type AdministratorListQuery = z.infer<typeof administratorListQuerySchema>
