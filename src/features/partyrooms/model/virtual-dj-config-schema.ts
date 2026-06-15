import { z } from "zod"
import {
  virtualDjConfigShape,
  applyManagedConditional,
} from "./virtual-dj-config-core"

// backend §5.3 — PUT /api/v1/admin/partyrooms/{id}/virtual-dj
//   per-room config (partyroomIds 없음). MANAGED 조건은 bulk 와 동일 (core 공유).
export const VirtualDjConfigSchema = z
  .object(virtualDjConfigShape)
  .superRefine(applyManagedConditional)

export type VirtualDjConfigRequest = z.infer<typeof VirtualDjConfigSchema>
