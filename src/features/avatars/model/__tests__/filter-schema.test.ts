import { describe, it, expect } from "vitest"
import {
  bodyListQuerySchema,
  faceListQuerySchema,
  LifecycleStatusEnum,
  ObtainmentTypeEnum,
} from "../filter-schema"

describe("bodyListQuerySchema", () => {
  it("default empty parses", () => {
    expect(bodyListQuerySchema.parse({})).toEqual({})
  })

  it("status + obtainableType filter parse", () => {
    const r = bodyListQuerySchema.parse({
      status: "PUBLISHED",
      obtainableType: "DJ_PNT",
    })
    expect(r.status).toBe("PUBLISHED")
    expect(r.obtainableType).toBe("DJ_PNT")
  })

  it("rejects unknown status", () => {
    expect(() => bodyListQuerySchema.parse({ status: "X" })).toThrow()
  })

  it("rejects unknown obtainableType", () => {
    expect(() => bodyListQuerySchema.parse({ obtainableType: "Z" })).toThrow()
  })
})

describe("faceListQuerySchema", () => {
  it("default empty parses", () => {
    expect(faceListQuerySchema.parse({})).toEqual({})
  })

  it("status only", () => {
    expect(faceListQuerySchema.parse({ status: "DRAFT" }).status).toBe("DRAFT")
  })
})

describe("enums", () => {
  it("LifecycleStatus 3종", () => {
    expect(LifecycleStatusEnum.options).toEqual(["DRAFT", "PUBLISHED", "RETIRED"])
  })

  it("ObtainmentType 4종", () => {
    expect(ObtainmentTypeEnum.options).toEqual([
      "BASIC", "DJ_PNT", "REF_LINK", "ROOM_ACT",
    ])
  })
})
