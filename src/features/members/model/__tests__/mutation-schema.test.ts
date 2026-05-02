import { describe, expect, it } from "vitest"
import { changeMemberTierRequestSchema } from "@/features/members/model/mutation-schema"

describe("changeMemberTierRequestSchema", () => {
  it("accepts FM/AM/GT (field name: targetTier per backend)", () => {
    expect(changeMemberTierRequestSchema.parse({ targetTier: "FM" })).toEqual({ targetTier: "FM" })
    expect(changeMemberTierRequestSchema.parse({ targetTier: "AM" })).toEqual({ targetTier: "AM" })
    expect(changeMemberTierRequestSchema.parse({ targetTier: "GT" })).toEqual({ targetTier: "GT" })
  })
  it("rejects unknown tier", () => {
    expect(() => changeMemberTierRequestSchema.parse({ targetTier: "XYZ" })).toThrow()
  })
})
