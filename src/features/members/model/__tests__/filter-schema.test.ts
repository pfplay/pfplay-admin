import { describe, it, expect } from "vitest"
import { membersListQuerySchema } from "../filter-schema"

describe("membersListQuerySchema", () => {
  it("빈 입력 → default (page=0, size=50, sort=created_at_desc)", () => {
    const r = membersListQuerySchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toEqual({ page: 0, size: 50, sort: "created_at_desc" })
  })

  it("email max 255 위반 → fail", () => {
    const r = membersListQuerySchema.safeParse({ email: "a".repeat(256) })
    expect(r.success).toBe(false)
  })

  it("tier=GT 통과 (강등 edge case)", () => {
    const r = membersListQuerySchema.safeParse({ tier: "GT" })
    expect(r.success).toBe(true)
  })

  it("joined_from > joined_to → fail", () => {
    const r = membersListQuerySchema.safeParse({ joined_from: "2026-04-30", joined_to: "2026-04-01" })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some(i => i.path[0] === "joined_to")).toBe(true)
    }
  })
})
