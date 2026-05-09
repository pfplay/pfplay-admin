import { describe, it, expect } from "vitest"
import { useRefineError } from "../use-refine-error"

describe("useRefineError", () => {
  it("RHF v7 errors[''] (빈 키)에 매핑된 top-level refine 에러를 반환", () => {
    const errors = {
      "": { message: "최소 한 필드는 입력해야 합니다", type: "custom" },
      title: { message: "필수", type: "required" },
    }
    expect(useRefineError(errors)).toEqual({
      message: "최소 한 필드는 입력해야 합니다",
      type: "custom",
    })
  })

  it("refine 에러가 없으면 undefined 반환 (다른 필드 에러는 무시)", () => {
    const errors = { title: { message: "필수" } }
    expect(useRefineError(errors)).toBeUndefined()
  })
})
