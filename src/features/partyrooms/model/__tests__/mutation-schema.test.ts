import { describe, expect, it } from "vitest"
import {
  TerminateReasonSchema,
  SuspendReasonSchema,
  UpdatePartyroomMetaSchema,
  UpdateDisplayFlagSchema,
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

describe("UpdatePartyroomMetaSchema", () => {
  it("accepts partial: title only", () => {
    expect(UpdatePartyroomMetaSchema.parse({ title: "신규 제목" })).toEqual({
      title: "신규 제목",
    })
  })

  it("accepts all 3 fields", () => {
    expect(
      UpdatePartyroomMetaSchema.parse({
        title: "t",
        introduction: "i",
        playbackTimeLimit: 10,
      }),
    ).toEqual({ title: "t", introduction: "i", playbackTimeLimit: 10 })
  })

  it("rejects empty object (refine — 최소 1개 필드)", () => {
    expect(() => UpdatePartyroomMetaSchema.parse({})).toThrow(/최소 1개/)
  })

  it("rejects title > 100 chars", () => {
    expect(() =>
      UpdatePartyroomMetaSchema.parse({ title: "x".repeat(101) }),
    ).toThrow()
  })

  it("rejects introduction > 500 chars", () => {
    expect(() =>
      UpdatePartyroomMetaSchema.parse({ introduction: "x".repeat(501) }),
    ).toThrow()
  })

  it("rejects playbackTimeLimit < 1 or > 60", () => {
    expect(() => UpdatePartyroomMetaSchema.parse({ playbackTimeLimit: 0 })).toThrow()
    expect(() => UpdatePartyroomMetaSchema.parse({ playbackTimeLimit: 61 })).toThrow()
  })
})

describe("UpdateDisplayFlagSchema", () => {
  it("accepts NORMAL/FEATURED/HIDDEN", () => {
    expect(UpdateDisplayFlagSchema.parse({ flag: "NORMAL" })).toEqual({ flag: "NORMAL" })
    expect(UpdateDisplayFlagSchema.parse({ flag: "FEATURED" })).toEqual({ flag: "FEATURED" })
    expect(UpdateDisplayFlagSchema.parse({ flag: "HIDDEN" })).toEqual({ flag: "HIDDEN" })
  })

  it("rejects unknown flag", () => {
    expect(() => UpdateDisplayFlagSchema.parse({ flag: "PUBLIC" })).toThrow()
  })

  it("rejects missing flag", () => {
    expect(() => UpdateDisplayFlagSchema.parse({})).toThrow()
  })
})
