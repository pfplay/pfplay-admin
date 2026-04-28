import { describe, it, expect } from "vitest"
import { formatKst } from "../format-kst"

describe("formatKst", () => {
  it("null 입력은 \"-\" 반환", () => {
    expect(formatKst(null)).toBe("-")
  })

  it("invalid ISO 문자열은 \"-\" 반환", () => {
    expect(formatKst("not-a-date")).toBe("-")
  })

  it("valid ISO 문자열은 ko-KR 24h 포맷으로 반환", () => {
    const result = formatKst("2026-04-28T03:45:12Z")
    // ko-KR 24h 포맷의 정확한 출력은 Node ICU 빌드/타임존에 따라 다를 수 있어
    // (1) "-"가 아니고
    // (2) 길이가 충분하며
    // (3) 24h 표기 (오전/오후 prefix 없음)
    // 만 검증
    expect(result).not.toBe("-")
    expect(result.length).toBeGreaterThan(8)
    expect(result).not.toMatch(/오전|오후|AM|PM/i)
  })
})
