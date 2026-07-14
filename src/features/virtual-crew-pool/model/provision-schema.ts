import { z } from "zod"

// backend ProvisionPoolRequest = @Min(1) @Max(500).
// number input value 는 문자열로 들어오므로 coerce 로 정규화한다.
export const provisionPoolSchema = z.object({
  count: z.coerce.number().int().min(1, "최소 1 이상").max(500, "최대 500 이하"),
})

export type ProvisionPoolRequest = z.infer<typeof provisionPoolSchema>
