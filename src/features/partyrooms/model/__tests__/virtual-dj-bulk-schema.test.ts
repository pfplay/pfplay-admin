import { describe, it, expect } from "vitest"
import { VirtualDjBulkSchema } from "../virtual-dj-bulk-schema"

describe("VirtualDjBulkSchema", () => {
  const managed = {
    partyroomIds: [1, 2, 3],
    status: "MANAGED" as const,
    targetCount: 8,
    companionFloor: 2,
    songPackId: 5,
  }

  it("MANAGED full body parses", () => {
    expect(VirtualDjBulkSchema.parse(managed)).toEqual(managed)
  })

  it("MANAGED + songPackId null 허용 (경고는 UI 책임)", () => {
    const r = VirtualDjBulkSchema.parse({ ...managed, songPackId: null })
    expect(r.songPackId).toBeNull()
  })

  it("MANAGED — targetCount null 거부 (필수)", () => {
    const r = VirtualDjBulkSchema.safeParse({ ...managed, targetCount: null })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "targetCount")).toBe(true)
    }
  })

  it("MANAGED — companionFloor null 거부 (필수)", () => {
    const r = VirtualDjBulkSchema.safeParse({
      ...managed,
      companionFloor: null,
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(
        r.error.issues.some((i) => i.path[0] === "companionFloor"),
      ).toBe(true)
    }
  })

  it("MANAGED — targetCount < 1 거부", () => {
    expect(
      VirtualDjBulkSchema.safeParse({ ...managed, targetCount: 0 }).success,
    ).toBe(false)
  })

  it("MANAGED — companionFloor 0 허용 (≥0)", () => {
    expect(
      VirtualDjBulkSchema.safeParse({ ...managed, companionFloor: 0 }).success,
    ).toBe(true)
  })

  it("MANAGED — companionFloor < 0 거부", () => {
    expect(
      VirtualDjBulkSchema.safeParse({ ...managed, companionFloor: -1 }).success,
    ).toBe(false)
  })

  it("OFF — target/floor null 이어도 통과 (검증 무관)", () => {
    expect(
      VirtualDjBulkSchema.safeParse({
        partyroomIds: [1],
        status: "OFF",
        targetCount: null,
        companionFloor: null,
        songPackId: null,
      }).success,
    ).toBe(true)
  })

  it("FROZEN — target/floor null 이어도 통과", () => {
    expect(
      VirtualDjBulkSchema.safeParse({
        partyroomIds: [1],
        status: "FROZEN",
        targetCount: null,
        companionFloor: null,
        songPackId: null,
      }).success,
    ).toBe(true)
  })

  it("rejects empty partyroomIds (min 1)", () => {
    expect(
      VirtualDjBulkSchema.safeParse({ ...managed, partyroomIds: [] }).success,
    ).toBe(false)
  })

  it("rejects partyroomIds.length > 100", () => {
    const ids = Array.from({ length: 101 }, (_, i) => i + 1)
    expect(
      VirtualDjBulkSchema.safeParse({ ...managed, partyroomIds: ids }).success,
    ).toBe(false)
  })

  it("rejects unknown status", () => {
    expect(
      VirtualDjBulkSchema.safeParse({ ...managed, status: "PAUSED" }).success,
    ).toBe(false)
  })
})
