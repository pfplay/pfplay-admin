import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { useProvisionPool } from "../use-provision-pool"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

describe("useProvisionPool", () => {
  afterEach(() => vi.restoreAllMocks())

  it("provision 성공 시 pool + bots 쿼리를 모두 invalidate 한다", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    server.use(
      http.post(
        "*/api/v1/admin/virtual-dj/pool",
        () => HttpResponse.json({ data: null }, { status: 201 }),
      ),
    )

    const { result } = renderHook(() => useProvisionPool(), { wrapper })
    result.current.mutate(2)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["virtual-dj", "pool"],
    })
    // 새로 만든 봇이 같은 페이지의 봇 로스터에 즉시 반영되도록 bots 도 무효화해야 한다.
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["virtual-dj", "bots"],
    })
  })

  it("provision 실패 시 invalidate 하지 않는다", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    server.use(
      http.post(
        "*/api/v1/admin/virtual-dj/pool",
        () =>
          HttpResponse.json(
            { status: 400, errorCode: null, message: "bad" },
            { status: 400 },
          ),
      ),
    )

    const { result } = renderHook(() => useProvisionPool(), { wrapper })
    result.current.mutate(2)
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
