import { z } from "zod"
import {
  virtualCrewConfigShape,
  applyManagedConditional,
} from "./virtual-crew-config-core"

// backend §5.3 — PUT /api/v1/admin/partyrooms/{id}/virtual-crew
//   per-room config (partyroomIds 없음). MANAGED 조건은 bulk 와 동일 (core 공유).
export const VirtualCrewConfigSchema = z
  .object(virtualCrewConfigShape)
  .superRefine(applyManagedConditional)

export type VirtualCrewConfigRequest = z.infer<typeof VirtualCrewConfigSchema>
