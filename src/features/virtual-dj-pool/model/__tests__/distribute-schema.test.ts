import { describe, it, expect } from "vitest"
import { distributeAvatarsSchema } from "../distribute-schema"

describe("distributeAvatarsSchema", () => {
  it("봇·아바타 모두 있으면 통과", () => {
    const r = distributeAvatarsSchema.safeParse({
      botIds: [1, 2],
      bodyUris: ["u1"],
    })
    expect(r.success).toBe(true)
  })

  it("빈 botIds 는 실패", () => {
    const r = distributeAvatarsSchema.safeParse({
      botIds: [],
      bodyUris: ["u1"],
    })
    expect(r.success).toBe(false)
  })

  it("빈 bodyUris(셋) 는 실패", () => {
    const r = distributeAvatarsSchema.safeParse({
      botIds: [1],
      bodyUris: [],
    })
    expect(r.success).toBe(false)
  })
})
