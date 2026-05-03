import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { z } from "zod"
import { toast } from "sonner"
import { useUrlMultiParamState } from "../use-url-multi-param-state"

const schema = z.object({
  status: z.array(z.enum(["PENDING", "RESOLVED"])).optional(),
  category: z.array(z.string()).optional(),
  page: z.coerce.number().int().min(0).default(0),
})

function wrapper(initialEntries: string[]) {
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  )
}

describe("useUrlMultiParamState", () => {
  afterEach(() => vi.restoreAllMocks())

  it("multi key는 getAll로 array, 그 외 scalar는 get", () => {
    const { result } = renderHook(
      () => useUrlMultiParamState(schema, ["status", "category"]),
      {
        wrapper: wrapper([
          "/?status=PENDING&status=RESOLVED&category=A&page=2",
        ]),
      },
    )
    expect(result.current.query).toEqual({
      status: ["PENDING", "RESOLVED"],
      category: ["A"],
      page: 2,
    })
  })

  it("invalid params → toast + 전체 reset → defaults 복귀 (14e 패턴)", () => {
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "")
    const { result } = renderHook(
      () => useUrlMultiParamState(schema, ["status", "category"]),
      { wrapper: wrapper(["/?status=BOGUS"]) },
    )
    expect(errorSpy).toHaveBeenCalled()
    expect(result.current.query).toEqual({ page: 0 })
  })

  it("setQuery 배열은 append, scalar는 set, reset은 전부 clear", () => {
    const { result } = renderHook(
      () => useUrlMultiParamState(schema, ["status", "category"]),
      { wrapper: wrapper(["/?status=PENDING"]) },
    )
    act(() => {
      result.current.setQuery({
        status: ["PENDING", "RESOLVED"],
        category: ["X"],
        page: 5,
      })
    })
    expect(result.current.query).toEqual({
      status: ["PENDING", "RESOLVED"],
      category: ["X"],
      page: 5,
    })
    act(() => {
      result.current.reset()
    })
    expect(result.current.query).toEqual({ page: 0 })
  })
})
