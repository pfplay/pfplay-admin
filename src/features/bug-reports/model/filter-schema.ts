import { z } from "zod"

export const bugReportsListQuerySchema = z.object({
  contentKeyword: z.string().max(255).optional(),
  createdFrom: z.string().optional(), // ISO LocalDateTime
  createdTo: z.string().optional(),
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.literal("createdAt").default("createdAt"),
  direction: z.enum(["ASC", "DESC"]).default("DESC"),
})

export type BugReportsListQuery = z.infer<typeof bugReportsListQuerySchema>
