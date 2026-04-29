import { describe, it, expect } from "vitest"
import { RetireAvatarRequestSchema } from "../retire-schema"

describe("RetireAvatarRequestSchema", () => {
  it("valid reason 1~1000자", () => {
    expect(RetireAvatarRequestSchema.parse({ reason: "회수 사유" })).toEqual({
      reason: "회수 사유",
    })
  })

  it("rejects empty reason", () => {
    expect(() => RetireAvatarRequestSchema.parse({ reason: "" })).toThrow()
  })

  it("rejects whitespace-only reason", () => {
    expect(() =>
      RetireAvatarRequestSchema.parse({ reason: "   \t\n   " }),
    ).toThrow()
  })

  it("rejects reason > 1000자", () => {
    expect(() =>
      RetireAvatarRequestSchema.parse({ reason: "a".repeat(1001) }),
    ).toThrow()
  })
})
