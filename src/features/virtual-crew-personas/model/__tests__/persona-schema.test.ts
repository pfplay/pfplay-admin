import { describe, it, expect } from "vitest"
import { createPersonaSchema, updatePersonaSchema } from "../persona-schema"

describe("createPersonaSchema", () => {
  const valid = { name: "친근한 DJ", instruction: "밝게 응답하라" }

  it("정상 입력 통과", () => {
    expect(createPersonaSchema.safeParse(valid).success).toBe(true)
  })

  it("name 빈 문자열 실패", () => {
    expect(
      createPersonaSchema.safeParse({ ...valid, name: "" }).success,
    ).toBe(false)
  })

  it("name 64자 통과 / 65자 실패", () => {
    expect(
      createPersonaSchema.safeParse({ ...valid, name: "n".repeat(64) }).success,
    ).toBe(true)
    expect(
      createPersonaSchema.safeParse({ ...valid, name: "n".repeat(65) }).success,
    ).toBe(false)
  })

  it("instruction 빈 문자열 실패 (NotBlank)", () => {
    expect(
      createPersonaSchema.safeParse({ ...valid, instruction: "" }).success,
    ).toBe(false)
  })

  it("instruction 4000자 통과 / 4001자 실패", () => {
    expect(
      createPersonaSchema.safeParse({ ...valid, instruction: "i".repeat(4000) })
        .success,
    ).toBe(true)
    expect(
      createPersonaSchema.safeParse({ ...valid, instruction: "i".repeat(4001) })
        .success,
    ).toBe(false)
  })
})

describe("updatePersonaSchema", () => {
  const valid = { name: "친근한 DJ", instruction: "밝게 응답하라", active: true }

  it("active 포함 정상 입력 통과", () => {
    expect(updatePersonaSchema.safeParse(valid).success).toBe(true)
    expect(
      updatePersonaSchema.safeParse({ ...valid, active: false }).success,
    ).toBe(true)
  })

  it("active 누락 실패", () => {
    const { active: _omit, ...noActive } = valid
    expect(updatePersonaSchema.safeParse(noActive).success).toBe(false)
  })

  it("name 빈 문자열 실패 / 65자 실패", () => {
    expect(updatePersonaSchema.safeParse({ ...valid, name: "" }).success).toBe(
      false,
    )
    expect(
      updatePersonaSchema.safeParse({ ...valid, name: "n".repeat(65) }).success,
    ).toBe(false)
  })

  it("instruction 4001자 실패", () => {
    expect(
      updatePersonaSchema.safeParse({ ...valid, instruction: "i".repeat(4001) })
        .success,
    ).toBe(false)
  })
})
