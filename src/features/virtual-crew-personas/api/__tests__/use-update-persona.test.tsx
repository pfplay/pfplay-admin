import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { useUpdatePersona } from "../use-update-persona"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

describe("useUpdatePersona", () => {
  afterEach(() => vi.restoreAllMocks())

  it("수정 성공 시 personas 목록 + 해당 persona 상세 쿼리를 모두 invalidate 한다", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    server.use(
      http.put(
        "*/api/v1/admin/virtual-crew/personas/7",
        () => new HttpResponse(null, { status: 204 }),
      ),
    )

    const { result } = renderHook(() => useUpdatePersona(), { wrapper })
    result.current.mutate({
      id: 7,
      body: { name: "DJ Nova", instruction: "be chill", active: true },
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["virtual-crew", "personas"],
    })
    // 상세 화면이 즉시 최신화되도록 detail 키도 무효화해야 한다.
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["virtual-crew", "persona", 7],
    })
  })

  it("수정 실패 시 invalidate 하지 않는다", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    server.use(
      http.put("*/api/v1/admin/virtual-crew/personas/7", () =>
        HttpResponse.json(
          { status: 400, errorCode: null, message: "bad" },
          { status: 400 },
        ),
      ),
    )

    const { result } = renderHook(() => useUpdatePersona(), { wrapper })
    result.current.mutate({
      id: 7,
      body: { name: "DJ Nova", instruction: "be chill", active: true },
    })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
