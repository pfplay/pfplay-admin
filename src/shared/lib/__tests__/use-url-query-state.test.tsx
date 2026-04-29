import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { z } from "zod"
import { toast } from "sonner"
import { useUrlQueryState } from "../use-url-query-state"

const schema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(100).default(50),
  sort: z.enum(["asc", "desc"]).default("desc"),
})

function wrapper(initialEntries: string[]) {
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  )
}

describe("useUrlQueryState", () => {
  afterEach(() => vi.restoreAllMocks())

  it("default URL → schema defaults", () => {
    const { result } = renderHook(() => useUrlQueryState(schema), {
      wrapper: wrapper(["/?"]),
    })
    expect(result.current.query).toEqual({ page: 0, size: 50, sort: "desc" })
  })

  it("valid URL params parse", () => {
    const { result } = renderHook(() => useUrlQueryState(schema), {
      wrapper: wrapper(["/?page=2&size=25&sort=asc"]),
    })
    expect(result.current.query).toEqual({ page: 2, size: 25, sort: "asc" })
  })

  it("invalid params → toast + cleaned to defaults", () => {
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "")
    const { result } = renderHook(() => useUrlQueryState(schema), {
      wrapper: wrapper(["/?sort=BOGUS"]),
    })
    // useEffect가 invalid drop + setParams(replace) → 재렌더 후 defaults 복귀.
    // null window는 microtask-thin이라 RTL renderHook으로는 관측 불가 (구현 세부, UX 영향 0).
    expect(errorSpy).toHaveBeenCalled()
    expect(result.current.query).toEqual({ page: 0, size: 50, sort: "desc" })
  })

  it("setQuery / reset 함수 노출 (행위 검증은 widget integration에서)", () => {
    const { result } = renderHook(() => useUrlQueryState(schema), {
      wrapper: wrapper(["/?page=2"]),
    })
    expect(typeof result.current.setQuery).toBe("function")
    expect(typeof result.current.reset).toBe("function")
  })
})
