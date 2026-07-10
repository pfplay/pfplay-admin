import { z } from "zod"
import {
  virtualCrewConfigShape,
  applyManagedConditional,
  VirtualCrewStatusEnum,
} from "./virtual-crew-config-core"

// backend §5.2 — PUT /api/v1/admin/virtual-crew/bulk
//   partyroomIds @NotEmpty @Size(1..100)
//   status/targetCount/djBotCount/songPackId 규칙은 virtual-crew-config-core 공유
export { VirtualCrewStatusEnum }

export const VirtualCrewBulkSchema = z
  .object({
    partyroomIds: z.array(z.number()).min(1).max(100),
    ...virtualCrewConfigShape,
  })
  .superRefine(applyManagedConditional)

export type VirtualCrewBulkRequest = z.infer<typeof VirtualCrewBulkSchema>
