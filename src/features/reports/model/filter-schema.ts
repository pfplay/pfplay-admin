import { z } from "zod"

export const ReportStatusEnum = z.enum([
  "PENDING",
  "REVIEWING",
  "RESOLVED",
  "DISMISSED",
])
export type ReportStatus = z.infer<typeof ReportStatusEnum>

export const ReportCategoryEnum = z.enum([
  "INAPPROPRIATE_CONTENT",
  "HARASSMENT",
  "SPAM",
  "COPYRIGHT",
  "OTHER",
])
export type ReportCategory = z.infer<typeof ReportCategoryEnum>

export const ReportsSortEnum = z.enum(["created_at_desc", "created_at_asc"])
export type ReportsSort = z.infer<typeof ReportsSortEnum>

const dateFormat = /^\d{4}-\d{2}-\d{2}$/

export const reportsListQuerySchema = z
  .object({
    status: z.array(ReportStatusEnum).optional(),
    category: z.array(ReportCategoryEnum).optional(),
    createdFrom: z.string().regex(dateFormat).optional(),
    createdTo: z.string().regex(dateFormat).optional(),
    page: z.coerce.number().int().min(0).default(0),
    size: z.coerce.number().int().min(1).max(200).default(50),
    sort: ReportsSortEnum.default("created_at_desc"),
  })
  .superRefine((v, ctx) => {
    if (v.createdFrom && v.createdTo && v.createdFrom > v.createdTo) {
      ctx.addIssue({
        code: "custom",
        path: ["createdTo"],
        message: "기간 시작일이 종료일보다 늦을 수 없어요",
      })
    }
  })

export type ReportsListQuery = z.infer<typeof reportsListQuerySchema>
