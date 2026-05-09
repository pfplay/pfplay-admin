import { z } from "zod"

// 이력 페이지의 URL state. backend pageable 1:1 — page 0-based, size 기본 20.
// 두 필드 모두 optional: 없으면 backend default 사용.
export const announcementListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional(),
  size: z.coerce.number().int().min(1).max(100).optional(),
})

export type AnnouncementListQuery = z.infer<typeof announcementListQuerySchema>
