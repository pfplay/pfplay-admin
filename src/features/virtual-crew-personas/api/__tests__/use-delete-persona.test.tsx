import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { useDeletePersona } from "../use-delete-persona"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

describe("useDeletePersona", () => {
  afterEach(() => vi.restoreAllMocks())

  it("삭제 성공 시 personas 목록 쿼리를 invalidate 한다", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    server.use(
      http.delete(
        "*/api/v1/admin/virtual-crew/personas/3",
        () => new HttpResponse(null, { status: 204 }),
      ),
    )

    const { result } = renderHook(() => useDeletePersona(), { wrapper })
    result.current.mutate(3)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["virtual-crew", "personas"],
    })
  })

  it("PERSONA_IN_USE(409) 삭제 실패 시 invalidate 하지 않는다", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    server.use(
      http.delete("*/api/v1/admin/virtual-crew/personas/3", () =>
        HttpResponse.json(
          { status: 409, errorCode: "PERSONA_IN_USE", message: "사용 중" },
          { status: 409 },
        ),
      ),
    )

    const { result } = renderHook(() => useDeletePersona(), { wrapper })
    result.current.mutate(3)
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
