import { describe, it, expect } from "vitest"
import { chatConfigSchema } from "../chat-config-schema"

describe("chatConfigSchema", () => {
  const valid = {
    chatEnabled: true,
    selfUpdateEnabled: false,
    probabilityPercent: 50,
    cooldownSeconds: 15,
    contextSize: 10,
    outputMaxTokens: 200,
  }

  it("정상 입력 통과", () => {
    expect(chatConfigSchema.safeParse(valid).success).toBe(true)
  })

  it("probabilityPercent 0/100 통과 / -1·101 실패", () => {
    expect(
      chatConfigSchema.safeParse({ ...valid, probabilityPercent: 0 }).success,
    ).toBe(true)
    expect(
      chatConfigSchema.safeParse({ ...valid, probabilityPercent: 100 }).success,
    ).toBe(true)
    expect(
      chatConfigSchema.safeParse({ ...valid, probabilityPercent: -1 }).success,
    ).toBe(false)
    expect(
      chatConfigSchema.safeParse({ ...valid, probabilityPercent: 101 }).success,
    ).toBe(false)
  })

  it("probabilityPercent 소수 실패 (정수 강제)", () => {
    expect(
      chatConfigSchema.safeParse({ ...valid, probabilityPercent: 50.5 }).success,
    ).toBe(false)
  })

  it("cooldownSeconds 1 통과 / 0 실패", () => {
    expect(
      chatConfigSchema.safeParse({ ...valid, cooldownSeconds: 1 }).success,
    ).toBe(true)
    expect(
      chatConfigSchema.safeParse({ ...valid, cooldownSeconds: 0 }).success,
    ).toBe(false)
  })

  it("contextSize 0 실패 / outputMaxTokens 0 실패", () => {
    expect(
      chatConfigSchema.safeParse({ ...valid, contextSize: 0 }).success,
    ).toBe(false)
    expect(
      chatConfigSchema.safeParse({ ...valid, outputMaxTokens: 0 }).success,
    ).toBe(false)
  })

  it("boolean 누락 실패", () => {
    const { chatEnabled: _o, ...noChat } = valid
    expect(chatConfigSchema.safeParse(noChat).success).toBe(false)
  })
})
