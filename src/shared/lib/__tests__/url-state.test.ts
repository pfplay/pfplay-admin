import { describe, it, expect } from "vitest"
import { z } from "zod"
import { parseSearchParams, stripInvalidParams, serializeQuery } from "../url-state"

const schema = z.object({
  email: z.string().max(5).optional(),
  page: z.coerce.number().int().min(0).default(0),
  sort: z.enum(["asc", "desc"]).default("desc"),
})

describe("parseSearchParams", () => {
  it("URLSearchParams를 zod로 parse 한다 (default 적용)", () => {
    const r = parseSearchParams(schema, new URLSearchParams("email=a"))
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data).toEqual({ email: "a", page: 0, sort: "desc" })
    }
  })

  it("invalid 값은 success=false", () => {
    const r = parseSearchParams(schema, new URLSearchParams("email=toolongstring&sort=foo"))
    expect(r.success).toBe(false)
  })
})

describe("stripInvalidParams", () => {
  it("invalid 필드만 drop한 새 URLSearchParams를 반환한다", () => {
    const params = new URLSearchParams("email=toolongstring&page=2&sort=foo")
    const r = parseSearchParams(schema, params)
    expect(r.success).toBe(false)
    if (!r.success) {
      const cleaned = stripInvalidParams(params, r.error)
      expect(cleaned.get("email")).toBeNull()
      expect(cleaned.get("page")).toBe("2")
      expect(cleaned.get("sort")).toBeNull()
    }
  })
})

describe("serializeQuery", () => {
  it("undefined/빈 문자열은 drop, 나머지는 string화", () => {
    const out = serializeQuery({ email: "a", tier: undefined, page: 0, sort: "desc" })
    expect(out.toString()).toBe("email=a&page=0&sort=desc")
  })
})
