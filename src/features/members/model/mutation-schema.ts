import { z } from "zod"
import { TierEnum } from "./filter-schema"

export const changeMemberTierRequestSchema = z.object({
  tier: TierEnum,
})

export type ChangeMemberTierRequest = z.infer<typeof changeMemberTierRequestSchema>
