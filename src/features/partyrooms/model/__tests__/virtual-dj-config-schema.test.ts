import { describe, it, expect } from "vitest"
import { VirtualDjConfigSchema } from "../virtual-dj-config-schema"

describe("VirtualDjConfigSchema", () => {
  it("OFF — target/floor null 허용 (검증 통과)", () => {
    const r = VirtualDjConfigSchema.safeParse({
      status: "OFF",
      targetCount: null,
      companionFloor: null,
      songPackId: null,
    })
    expect(r.success).toBe(true)
  })

  it("FROZEN — target/floor null 허용 (검증 통과)", () => {
    const r = VirtualDjConfigSchema.safeParse({
      status: "FROZEN",
      targetCount: null,
      companionFloor: null,
      songPackId: null,
    })
    expect(r.success).toBe(true)
  })

  it("MANAGED + target null → 실패 (targetCount path)", () => {
    const r = VirtualDjConfigSchema.safeParse({
      status: "MANAGED",
      targetCount: null,
      companionFloor: 0,
      songPackId: null,
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "targetCount")).toBe(true)
    }
  })

  it("MANAGED + floor null → 실패 (companionFloor path)", () => {
    const r = VirtualDjConfigSchema.safeParse({
      status: "MANAGED",
      targetCount: 5,
      companionFloor: null,
      songPackId: null,
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "companionFloor")).toBe(
        true,
      )
    }
  })

  it("MANAGED + target<1 → 실패", () => {
    const r = VirtualDjConfigSchema.safeParse({
      status: "MANAGED",
      targetCount: 0,
      companionFloor: 0,
      songPackId: null,
    })
    expect(r.success).toBe(false)
  })

  it("MANAGED 완전 입력 → 통과 (songPackId null 허용)", () => {
    const r = VirtualDjConfigSchema.safeParse({
      status: "MANAGED",
      targetCount: 8,
      companionFloor: 2,
      songPackId: null,
    })
    expect(r.success).toBe(true)
  })
})
