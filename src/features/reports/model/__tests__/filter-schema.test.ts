import { describe, it, expect } from "vitest"
import { reportsListQuerySchema } from "../filter-schema"

describe("reportsListQuerySchema", () => {
  it("defaults: page=0, size=50, sort=created_at_desc", () => {
    const r = reportsListQuerySchema.parse({})
    expect(r.page).toBe(0)
    expect(r.size).toBe(50)
    expect(r.sort).toBe("created_at_desc")
    expect(r.status).toBeUndefined()
    expect(r.category).toBeUndefined()
  })

  it("multi status[] / category[] parse", () => {
    const r = reportsListQuerySchema.parse({
      status: ["PENDING", "REVIEWING"],
      category: ["INAPPROPRIATE_CONTENT", "HARASSMENT"],
    })
    expect(r.status).toEqual(["PENDING", "REVIEWING"])
    expect(r.category).toEqual(["INAPPROPRIATE_CONTENT", "HARASSMENT"])
  })

  it("rejects unknown status / category", () => {
    expect(() =>
      reportsListQuerySchema.parse({ status: ["BOGUS"] }),
    ).toThrow()
    expect(() =>
      reportsListQuerySchema.parse({ category: ["INVALID"] }),
    ).toThrow()
  })

  it("rejects unknown sort", () => {
    expect(() =>
      reportsListQuerySchema.parse({ sort: "foo,bar" }),
    ).toThrow()
  })

  it("date format: yyyy-MM-dd accepted", () => {
    const r = reportsListQuerySchema.parse({
      createdFrom: "2026-01-01",
      createdTo: "2026-04-29",
    })
    expect(r.createdFrom).toBe("2026-01-01")
    expect(r.createdTo).toBe("2026-04-29")
  })

  it("rejects invalid date format", () => {
    expect(() =>
      reportsListQuerySchema.parse({ createdFrom: "01/01/2026" }),
    ).toThrow()
  })

  it("createdFrom > createdTo → refine fail", () => {
    expect(() =>
      reportsListQuerySchema.parse({
        createdFrom: "2026-04-29",
        createdTo: "2026-01-01",
      }),
    ).toThrow(/시작.*늦/)
  })

  it("page/size coerce + min/max", () => {
    const r = reportsListQuerySchema.parse({ page: "3", size: "100" })
    expect(r.page).toBe(3)
    expect(r.size).toBe(100)
    expect(() => reportsListQuerySchema.parse({ page: -1 })).toThrow()
    expect(() => reportsListQuerySchema.parse({ size: 201 })).toThrow()
  })
})
