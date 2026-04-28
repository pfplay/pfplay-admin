import { describe, expect, it } from "vitest"
import { changeMemberTierRequestSchema } from "@/features/members/model/mutation-schema"

describe("changeMemberTierRequestSchema", () => {
  it("accepts FM/AM/GT", () => {
    expect(changeMemberTierRequestSchema.parse({ tier: "FM" })).toEqual({ tier: "FM" })
    expect(changeMemberTierRequestSchema.parse({ tier: "AM" })).toEqual({ tier: "AM" })
    expect(changeMemberTierRequestSchema.parse({ tier: "GT" })).toEqual({ tier: "GT" })
  })
  it("rejects unknown tier", () => {
    expect(() => changeMemberTierRequestSchema.parse({ tier: "XYZ" })).toThrow()
  })
})
