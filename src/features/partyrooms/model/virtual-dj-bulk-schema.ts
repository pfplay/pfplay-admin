import { z } from "zod"
import {
  virtualDjConfigShape,
  applyManagedConditional,
  VirtualDjStatusEnum,
} from "./virtual-dj-config-core"

// backend §5.2 — PUT /api/v1/admin/virtual-dj/bulk
//   partyroomIds @NotEmpty @Size(1..100)
//   status/targetCount/companionFloor/songPackId 규칙은 virtual-dj-config-core 공유
export { VirtualDjStatusEnum }

export const VirtualDjBulkSchema = z
  .object({
    partyroomIds: z.array(z.number()).min(1).max(100),
    ...virtualDjConfigShape,
  })
  .superRefine(applyManagedConditional)

export type VirtualDjBulkRequest = z.infer<typeof VirtualDjBulkSchema>
