import { describe, expect, it } from "vitest"
import {
  TerminateReasonSchema,
  SuspendReasonSchema,
} from "@/features/partyrooms/model/mutation-schema"

describe("TerminateReasonSchema", () => {
  it("accepts non-blank reason within 500 chars", () => {
    expect(TerminateReasonSchema.parse({ reason: "테스트" })).toEqual({ reason: "테스트" })
  })

  it("rejects empty reason", () => {
    expect(() => TerminateReasonSchema.parse({ reason: "" })).toThrow()
  })

  it("rejects reason > 500 chars", () => {
    expect(() => TerminateReasonSchema.parse({ reason: "x".repeat(501) })).toThrow()
  })
})

describe("SuspendReasonSchema", () => {
  it("matches Terminate shape", () => {
    expect(SuspendReasonSchema.parse({ reason: "x" })).toEqual({ reason: "x" })
  })
})
