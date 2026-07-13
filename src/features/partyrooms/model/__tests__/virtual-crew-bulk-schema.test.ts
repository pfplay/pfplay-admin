import { describe, it, expect } from "vitest"
import { VirtualCrewBulkSchema } from "../virtual-crew-bulk-schema"

describe("VirtualCrewBulkSchema", () => {
  const managed = {
    partyroomIds: [1, 2, 3],
    status: "MANAGED" as const,
    targetCount: 8,
    djBotCount: 2,
    songPackId: 5,
  }

  it("MANAGED full body parses", () => {
    expect(VirtualCrewBulkSchema.parse(managed)).toEqual(managed)
  })

  it("MANAGED + songPackId null → 거부 (송팩 필수)", () => {
    const r = VirtualCrewBulkSchema.safeParse({ ...managed, songPackId: null })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "songPackId")).toBe(true)
    }
  })

  it("MANAGED — targetCount null 거부 (필수)", () => {
    const r = VirtualCrewBulkSchema.safeParse({ ...managed, targetCount: null })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "targetCount")).toBe(true)
    }
  })

  it("MANAGED — djBotCount null 거부 (필수)", () => {
    const r = VirtualCrewBulkSchema.safeParse({
      ...managed,
      djBotCount: null,
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(
        r.error.issues.some((i) => i.path[0] === "djBotCount"),
      ).toBe(true)
    }
  })

  it("MANAGED — targetCount < 1 거부", () => {
    expect(
      VirtualCrewBulkSchema.safeParse({ ...managed, targetCount: 0 }).success,
    ).toBe(false)
  })

  it("MANAGED — djBotCount 0 허용 (≥0)", () => {
    expect(
      VirtualCrewBulkSchema.safeParse({ ...managed, djBotCount: 0 }).success,
    ).toBe(true)
  })

  it("MANAGED — djBotCount < 0 거부", () => {
    expect(
      VirtualCrewBulkSchema.safeParse({ ...managed, djBotCount: -1 }).success,
    ).toBe(false)
  })

  it("MANAGED — djBotCount > targetCount 거부", () => {
    const r = VirtualCrewBulkSchema.safeParse({
      ...managed,
      targetCount: 3,
      djBotCount: 5,
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "djBotCount")).toBe(true)
    }
  })

  it("OFF — target/djBot null 이어도 통과 (검증 무관)", () => {
    expect(
      VirtualCrewBulkSchema.safeParse({
        partyroomIds: [1],
        status: "OFF",
        targetCount: null,
        djBotCount: null,
        songPackId: null,
      }).success,
    ).toBe(true)
  })

  it("rejects empty partyroomIds (min 1)", () => {
    expect(
      VirtualCrewBulkSchema.safeParse({ ...managed, partyroomIds: [] }).success,
    ).toBe(false)
  })

  it("rejects partyroomIds.length > 100", () => {
    const ids = Array.from({ length: 101 }, (_, i) => i + 1)
    expect(
      VirtualCrewBulkSchema.safeParse({ ...managed, partyroomIds: ids }).success,
    ).toBe(false)
  })

  it("rejects unknown status", () => {
    expect(
      VirtualCrewBulkSchema.safeParse({ ...managed, status: "PAUSED" }).success,
    ).toBe(false)
  })
})
