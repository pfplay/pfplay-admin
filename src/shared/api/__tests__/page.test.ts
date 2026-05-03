import { describe, it, expect } from "vitest"
import { unwrap } from "../page"
import type { ApiCommonResponse, Page } from "../page"

describe("unwrap", () => {
  it("ApiCommonResponse.data를 그대로 반환한다", () => {
    const res: ApiCommonResponse<{ value: number }> = { data: { value: 42 } }
    expect(unwrap(res)).toEqual({ value: 42 })
  })

  it("Page<T> 형태의 data를 그대로 반환한다", () => {
    const res: ApiCommonResponse<Page<string>> = {
      data: {
        content: ["a"], totalElements: 1, totalPages: 1, number: 0, size: 50,
        first: true, last: true, empty: false, numberOfElements: 1,
      },
    }
    expect(unwrap(res).content).toEqual(["a"])
  })
})
