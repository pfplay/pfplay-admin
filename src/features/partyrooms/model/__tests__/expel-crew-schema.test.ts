import { describe, expect, it } from "vitest"
import { ExpelCrewSchema } from "@/features/partyrooms/model/mutation-schema"

describe("ExpelCrewSchema", () => {
  it("accepts valid crewId + reason", () => {
    const r = ExpelCrewSchema.safeParse({ crewId: 14, reason: "bug cleanup" })
    expect(r.success).toBe(true)
  })
  it("rejects empty/whitespace reason", () => {
    expect(ExpelCrewSchema.safeParse({ crewId: 14, reason: "" }).success).toBe(false)
    expect(ExpelCrewSchema.safeParse({ crewId: 14, reason: "   " }).success).toBe(false)
  })
  it("rejects reason > 255", () => {
    expect(
      ExpelCrewSchema.safeParse({ crewId: 14, reason: "x".repeat(256) }).success,
    ).toBe(false)
  })
  it("rejects non-positive / non-int crewId", () => {
    expect(ExpelCrewSchema.safeParse({ crewId: 0, reason: "a" }).success).toBe(false)
    expect(ExpelCrewSchema.safeParse({ crewId: 1.5, reason: "a" }).success).toBe(false)
  })
})
