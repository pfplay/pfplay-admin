import { describe, it, expect } from "vitest"
import {
  BulkPartyroomActionSchema,
  BulkActionResultSchema,
  BulkPartyroomActionResponseSchema,
} from "../bulk-schema"

describe("BulkPartyroomActionSchema", () => {
  const valid = {
    partyroomIds: [1, 2, 3],
    action: "TERMINATE" as const,
    reason: "abuse",
    skipErrors: true,
  }

  it("valid full body parses", () => {
    expect(BulkPartyroomActionSchema.parse(valid)).toEqual(valid)
  })

  it("skipErrors omitted → optional", () => {
    const { skipErrors: _, ...rest } = valid
    expect(BulkPartyroomActionSchema.parse(rest)).toEqual(rest)
  })

  it("rejects empty partyroomIds (min 1)", () => {
    expect(() =>
      BulkPartyroomActionSchema.parse({ ...valid, partyroomIds: [] }),
    ).toThrow()
  })

  it("rejects partyroomIds.length > 100", () => {
    const ids = Array.from({ length: 101 }, (_, i) => i + 1)
    expect(() =>
      BulkPartyroomActionSchema.parse({ ...valid, partyroomIds: ids }),
    ).toThrow()
  })

  it("accepts SUSPEND / SET_HIDDEN action enum", () => {
    expect(
      BulkPartyroomActionSchema.parse({ ...valid, action: "SUSPEND" }).action,
    ).toBe("SUSPEND")
    expect(
      BulkPartyroomActionSchema.parse({ ...valid, action: "SET_HIDDEN" }).action,
    ).toBe("SET_HIDDEN")
  })

  it("rejects unknown action", () => {
    expect(() =>
      BulkPartyroomActionSchema.parse({ ...valid, action: "PUBLIC" }),
    ).toThrow()
  })

  it("rejects empty reason (min 1)", () => {
    expect(() =>
      BulkPartyroomActionSchema.parse({ ...valid, reason: "" }),
    ).toThrow()
  })

  it("rejects reason > 500 chars", () => {
    expect(() =>
      BulkPartyroomActionSchema.parse({ ...valid, reason: "a".repeat(501) }),
    ).toThrow()
  })
})

describe("BulkActionResultSchema", () => {
  it("success=true → error=null OK", () => {
    expect(
      BulkActionResultSchema.parse({ partyroomId: 1, success: true, error: null }),
    ).toEqual({ partyroomId: 1, success: true, error: null })
  })

  it("success=false → error=string OK", () => {
    expect(
      BulkActionResultSchema.parse({
        partyroomId: 1,
        success: false,
        error: "ALREADY_TERMINATED",
      }),
    ).toEqual({ partyroomId: 1, success: false, error: "ALREADY_TERMINATED" })
  })

  it("rejects missing partyroomId", () => {
    expect(() =>
      BulkActionResultSchema.parse({ success: true, error: null }),
    ).toThrow()
  })

  it("rejects missing error field (must be null or string)", () => {
    expect(() =>
      BulkActionResultSchema.parse({ partyroomId: 1, success: true }),
    ).toThrow()
  })
})

describe("BulkPartyroomActionResponseSchema", () => {
  it("results 배열 wrap parse", () => {
    expect(
      BulkPartyroomActionResponseSchema.parse({
        results: [
          { partyroomId: 1, success: true, error: null },
          { partyroomId: 2, success: false, error: "X" },
        ],
      }).results,
    ).toHaveLength(2)
  })

  it("rejects results 부재", () => {
    expect(() => BulkPartyroomActionResponseSchema.parse({})).toThrow()
  })
})
