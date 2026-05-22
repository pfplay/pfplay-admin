import { z } from "zod"

export const GuestSortEnum = z.enum([
  "created_at_desc",
  "created_at_asc",
  "last_activity_desc",
])
export type GuestSort = z.infer<typeof GuestSortEnum>

export const guestsListQuerySchema = z
  .object({
    email: z.string().max(255).optional(),
    joined_from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    joined_to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    page: z.coerce.number().int().min(0).default(0),
    size: z.coerce.number().int().min(1).max(200).default(50),
    sort: GuestSortEnum.default("created_at_desc"),
  })
  .superRefine((v, ctx) => {
    // members schema 의 동등 검증 — backend 가 400 으로 가드하나 UX parity 유지
    if (v.joined_from && v.joined_to && v.joined_from > v.joined_to) {
      ctx.addIssue({
        code: "custom",
        path: ["joined_to"],
        message: "가입일 종료가 시작보다 빨라요",
      })
    }
  })

export type GuestsListQuery = z.infer<typeof guestsListQuerySchema>
