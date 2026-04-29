import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
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

  it("invalid params → toast + null query", () => {
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "")
    const { result } = renderHook(() => useUrlQueryState(schema), {
      wrapper: wrapper(["/?sort=BOGUS"]),
    })
    // initial render parsed.success false → null, useEffect 후 setParams cleaned
    expect(result.current.query).toBeNull()
    expect(errorSpy).toHaveBeenCalled()
  })

  it("setQuery / reset 함수 노출 (행위 검증은 widget integration에서)", () => {
    const { result } = renderHook(() => useUrlQueryState(schema), {
      wrapper: wrapper(["/?page=2"]),
    })
    expect(typeof result.current.setQuery).toBe("function")
    expect(typeof result.current.reset).toBe("function")
  })
})
