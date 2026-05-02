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

// backend §2.3 — BulkActionResult{partyroomId, success, error: String | null, errorCode: String | null}
// errorCode: A5 ship `9ddc0f95` — success=true 시 null, 실패 시 14c §7.1 매트릭스(예: PRT-001) 매핑 가능.
//   optional 마킹은 openapi 산출물이 잠시 outdated일 수 있는 운영 환경 보호용 (forward-compat).
export const BulkActionResultSchema = z.object({
  partyroomId: z.number(),
  success: z.boolean(),
  error: z.string().nullable(),
  errorCode: z.string().nullable().optional(),
})
export type BulkActionResult = z.infer<typeof BulkActionResultSchema>

export const BulkPartyroomActionResponseSchema = z.object({
  results: z.array(BulkActionResultSchema),
})
export type BulkPartyroomActionResponse = z.infer<typeof BulkPartyroomActionResponseSchema>
