import { describe, it, expect } from "vitest"
import { formatKst } from "../format-kst"

describe("formatKst", () => {
  it("null 입력은 \"-\" 반환", () => {
    expect(formatKst(null)).toBe("-")
  })

  it("invalid ISO 문자열은 \"-\" 반환", () => {
    expect(formatKst("not-a-date")).toBe("-")
  })

  it("valid ISO 문자열은 KST 시각 + KST suffix로 반환 (OS timezone 무관)", () => {
    // 2026-04-28T03:45:12Z = 2026-04-28 12:45:12 KST (UTC+9)
    // ko-KR 시간 표기는 ICU 빌드에 따라 "12:45:12" 또는 "12시 45분 12초" 두 형태가 가능 — 둘 다 허용.
    const result = formatKst("2026-04-28T03:45:12Z")
    expect(result).toMatch(/KST$/)
    expect(result).not.toMatch(/오전|오후|AM|PM/i)
    // KST 변환 검증 — 시각이 12 + 45를 포함 (UTC 03 → KST 12 변환이 실제 적용됐는지)
    expect(result).toMatch(/12[:시][\s\d]*45/)
  })
})
