import { describe, it, expect } from "vitest"
import { guestsListQuerySchema } from "../filter-schema"

describe("guestsListQuerySchema", () => {
  it("defaults sort=created_at_desc / page=0 / size=50", () => {
    const parsed = guestsListQuerySchema.parse({})
    expect(parsed.sort).toBe("created_at_desc")
    expect(parsed.page).toBe(0)
    expect(parsed.size).toBe(50)
  })

  it("rejects size > 200", () => {
    expect(() => guestsListQuerySchema.parse({ size: 500 })).toThrow()
  })

  it("rejects invalid sort", () => {
    expect(() => guestsListQuerySchema.parse({ sort: "random_xyz" })).toThrow()
  })

  it("accepts ISO date format for joined_from/to", () => {
    const parsed = guestsListQuerySchema.parse({
      joined_from: "2026-01-01",
      joined_to: "2026-12-31",
    })
    expect(parsed.joined_from).toBe("2026-01-01")
  })

  it("does not have tier field", () => {
    const parsed = guestsListQuerySchema.parse({
      tier: "FM",
    } as unknown as Record<string, unknown>)
    expect("tier" in parsed).toBe(false)
  })

  it("rejects joined_to earlier than joined_from (superRefine parity with members)", () => {
    const result = guestsListQuerySchema.safeParse({
      joined_from: "2026-12-31",
      joined_to: "2026-01-01",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path[0] === "joined_to"),
      ).toBe(true)
    }
  })
})
