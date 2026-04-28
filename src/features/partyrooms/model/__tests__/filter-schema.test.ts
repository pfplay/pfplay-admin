import { describe, it, expect } from "vitest"
import { partyroomsListQuerySchema, PartyroomSortEnum } from "../filter-schema"

describe("partyroomsListQuerySchema", () => {
  it("default: page=0, size=50, sort=createdAt,desc", () => {
    const r = partyroomsListQuerySchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toEqual({ page: 0, size: 50, sort: "createdAt,desc" })
  })

  it("status enum 화이트리스트 (ACTIVE/SUSPENDED/TERMINATED)", () => {
    expect(partyroomsListQuerySchema.safeParse({ status: "ACTIVE" }).success).toBe(true)
    expect(partyroomsListQuerySchema.safeParse({ status: "ARCHIVED" }).success).toBe(false)
  })

  it("PartyroomSortEnum 5 columns × asc/desc = 10 옵션", () => {
    expect(PartyroomSortEnum.options).toHaveLength(10)
    expect(PartyroomSortEnum.options).toContain("hostNickname,asc")
    expect(PartyroomSortEnum.safeParse("invalid").success).toBe(false)
  })

  it("createdFrom > createdTo → fail", () => {
    const r = partyroomsListQuerySchema.safeParse({
      createdFrom: "2026-04-30T00:00:00.000Z",
      createdTo: "2026-04-01T00:00:00.000Z",
    })
    expect(r.success).toBe(false)
  })
})
