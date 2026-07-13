import { describe, it, expect } from "vitest"
import { VirtualCrewConfigSchema } from "../virtual-crew-config-schema"

describe("VirtualCrewConfigSchema", () => {
  it("OFF — target/djBot null 허용 (검증 통과)", () => {
    const r = VirtualCrewConfigSchema.safeParse({
      status: "OFF",
      targetCount: null,
      djBotCount: null,
      songPackId: null,
    })
    expect(r.success).toBe(true)
  })

  it("MANAGED + djBotCount > targetCount → 실패 (djBotCount path)", () => {
    const r = VirtualCrewConfigSchema.safeParse({
      status: "MANAGED",
      targetCount: 3,
      djBotCount: 5,
      songPackId: null,
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "djBotCount")).toBe(true)
    }
  })

  it("MANAGED + djBotCount === targetCount → 통과 (이하 허용)", () => {
    const r = VirtualCrewConfigSchema.safeParse({
      status: "MANAGED",
      targetCount: 3,
      djBotCount: 3,
      songPackId: 5,
    })
    expect(r.success).toBe(true)
  })

  it("MANAGED + target null → 실패 (targetCount path)", () => {
    const r = VirtualCrewConfigSchema.safeParse({
      status: "MANAGED",
      targetCount: null,
      djBotCount: 0,
      songPackId: null,
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "targetCount")).toBe(true)
    }
  })

  it("MANAGED + djBotCount null → 실패 (djBotCount path)", () => {
    const r = VirtualCrewConfigSchema.safeParse({
      status: "MANAGED",
      targetCount: 5,
      djBotCount: null,
      songPackId: null,
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "djBotCount")).toBe(
        true,
      )
    }
  })

  it("MANAGED + target<1 → 실패", () => {
    const r = VirtualCrewConfigSchema.safeParse({
      status: "MANAGED",
      targetCount: 0,
      djBotCount: 0,
      songPackId: null,
    })
    expect(r.success).toBe(false)
  })

  it("MANAGED + songPackId null → 실패 (송팩 필수, songPackId path)", () => {
    const r = VirtualCrewConfigSchema.safeParse({
      status: "MANAGED",
      targetCount: 8,
      djBotCount: 2,
      songPackId: null,
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "songPackId")).toBe(true)
    }
  })

  it("MANAGED 완전 입력(송팩 포함) → 통과", () => {
    const r = VirtualCrewConfigSchema.safeParse({
      status: "MANAGED",
      targetCount: 8,
      djBotCount: 2,
      songPackId: 5,
    })
    expect(r.success).toBe(true)
  })
})
