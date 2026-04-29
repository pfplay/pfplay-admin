import { z } from "zod"

// backend §2 — BulkPartyroomActionRequest:
//   partyroomIds @NotEmpty @Size(1..100)
//   action @NotNull BulkActionType{TERMINATE, SUSPEND, SET_HIDDEN}
//   reason @NotBlank @Size(max=500)
//   skipErrors Boolean? — default true (backend skipErrorsOrDefault)
export const BulkActionTypeEnum = z.enum(["TERMINATE", "SUSPEND", "SET_HIDDEN"])
export type BulkActionType = z.infer<typeof BulkActionTypeEnum>

export const BulkPartyroomActionSchema = z.object({
  partyroomIds: z.array(z.number()).min(1).max(100),
  action: BulkActionTypeEnum,
  reason: z.string().min(1).max(500),
  skipErrors: z.boolean().optional(),
})
export type BulkPartyroomActionRequest = z.infer<typeof BulkPartyroomActionSchema>

// backend §2.3 — BulkActionResult{partyroomId, success, error: String | null}
export const BulkActionResultSchema = z.object({
  partyroomId: z.number(),
  success: z.boolean(),
  error: z.string().nullable(),
})
export type BulkActionResult = z.infer<typeof BulkActionResultSchema>

export const BulkPartyroomActionResponseSchema = z.object({
  results: z.array(BulkActionResultSchema),
})
export type BulkPartyroomActionResponse = z.infer<typeof BulkPartyroomActionResponseSchema>
