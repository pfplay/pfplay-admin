import { describe, it, expect } from "vitest"
import { provisionPoolSchema } from "../provision-schema"

describe("provisionPoolSchema", () => {
  it("정상 — count 1 (최소)", () => {
    const r = provisionPoolSchema.safeParse({ count: 1 })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.count).toBe(1)
  })

  it("정상 — count 500 (최대)", () => {
    expect(provisionPoolSchema.safeParse({ count: 500 }).success).toBe(true)
  })

  it("문자열 입력 coerce → number", () => {
    const r = provisionPoolSchema.safeParse({ count: "30" })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.count).toBe(30)
  })

  it("count 0 거부", () => {
    expect(provisionPoolSchema.safeParse({ count: 0 }).success).toBe(false)
  })

  it("count 음수 거부", () => {
    expect(provisionPoolSchema.safeParse({ count: -5 }).success).toBe(false)
  })

  it("count 501 거부 (최대 초과)", () => {
    expect(provisionPoolSchema.safeParse({ count: 501 }).success).toBe(false)
  })

  it("소수 거부 (int)", () => {
    expect(provisionPoolSchema.safeParse({ count: 1.5 }).success).toBe(false)
  })
})
