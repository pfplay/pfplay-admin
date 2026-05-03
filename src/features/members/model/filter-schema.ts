import { z } from "zod"

export const TierEnum = z.enum(["FM", "AM", "GT"])
export type Tier = z.infer<typeof TierEnum>

export const MemberSortEnum = z.enum([
  "created_at_desc",
  "created_at_asc",
  "last_activity_desc",
])
export type MemberSort = z.infer<typeof MemberSortEnum>

export const membersListQuerySchema = z.object({
  email: z.string().max(255).optional(),
  tier: TierEnum.optional(),
  joined_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  joined_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(200).default(50),
  sort: MemberSortEnum.default("created_at_desc"),
}).superRefine((v, ctx) => {
  if (v.joined_from && v.joined_to && v.joined_from > v.joined_to) {
    ctx.addIssue({
      code: "custom",
      path: ["joined_to"],
      message: "가입일 종료가 시작보다 빨라요",
    })
  }
})

export type MembersListQuery = z.infer<typeof membersListQuerySchema>
