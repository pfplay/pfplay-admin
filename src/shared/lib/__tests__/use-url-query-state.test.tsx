import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { MemoryRouter, useLocation } from "react-router-dom"
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

// preserveExternalKeys 테스트용: useLocation 으로 search string 노출하는 헬퍼
function SearchProbe({
  children,
  onChange,
}: {
  children: React.ReactNode
  onChange: (search: string) => void
}) {
  const loc = useLocation()
  onChange(loc.search)
  return <>{children}</>
}

function probeWrapper(
  initialEntries: string[],
  onSearch: (search: string) => void,
) {
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>
      <SearchProbe onChange={onSearch}>{children}</SearchProbe>
    </MemoryRouter>
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

describe("useUrlQueryState — preserveExternalKeys", () => {
  const schemaWithEmail = z.object({
    email: z.string().max(255).optional(),
    page: z.coerce.number().int().min(0).default(0),
  })

  it("setQuery 시 preserveExternalKeys 의 외부 키 (tab) 가 URL 에 보존", () => {
    let currentSearch = ""
    const { result } = renderHook(
      () =>
        useUrlQueryState(schemaWithEmail, { preserveExternalKeys: ["tab"] }),
      {
        wrapper: probeWrapper(["/x?tab=guest&email=foo"], (s) => {
          currentSearch = s
        }),
      },
    )

    act(() => result.current.setQuery({ email: "bar" }))

    expect(currentSearch).toContain("tab=guest")
    expect(currentSearch).toContain("email=bar")
  })

  it("옵션 미지정 시 외부 키 (tab) 가 setQuery 후 사라짐 — 기존 동작 회귀 가드", () => {
    let currentSearch = ""
    // options 미전달 — 기존 호출처 (partyrooms 등) 동등 동작
    const { result } = renderHook(() => useUrlQueryState(schemaWithEmail), {
      wrapper: probeWrapper(["/x?tab=guest&email=foo"], (s) => {
        currentSearch = s
      }),
    })

    act(() => result.current.setQuery({ email: "bar" }))

    expect(currentSearch).not.toContain("tab=guest")
    expect(currentSearch).toContain("email=bar")
  })

  it("reset 시에도 preserveExternalKeys 의 외부 키 (tab) 가 URL 에 보존", () => {
    let currentSearch = ""
    const { result } = renderHook(
      () =>
        useUrlQueryState(schemaWithEmail, { preserveExternalKeys: ["tab"] }),
      {
        wrapper: probeWrapper(["/x?tab=guest&email=foo&page=3"], (s) => {
          currentSearch = s
        }),
      },
    )

    act(() => result.current.reset())

    expect(currentSearch).toContain("tab=guest")
    expect(currentSearch).not.toContain("email=foo")
    expect(currentSearch).not.toContain("page=3")
  })

  it("preserveExternalKeys 의 키가 URL 에 없으면 무영향", () => {
    let currentSearch = ""
    const { result } = renderHook(
      () =>
        useUrlQueryState(schemaWithEmail, { preserveExternalKeys: ["tab"] }),
      {
        wrapper: probeWrapper(["/x?email=foo"], (s) => {
          currentSearch = s
        }),
      },
    )

    act(() => result.current.setQuery({ email: "bar" }))

    expect(currentSearch).not.toContain("tab=")
    expect(currentSearch).toContain("email=bar")
  })
})
