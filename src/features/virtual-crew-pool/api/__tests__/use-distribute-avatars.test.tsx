import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { useDistributeAvatars } from "../use-distribute-avatars"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

describe("useDistributeAvatars", () => {
  afterEach(() => vi.restoreAllMocks())

  it("distribute 성공 시 bots 쿼리를 invalidate 한다", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    server.use(
      http.post("*/api/v1/admin/virtual-crew/bots/avatar/distribute", () =>
        HttpResponse.json(
          {
            data: {
              assigned: [{ userId: 1, avatarBodyUri: "body://a" }],
            },
          },
          { status: 200 },
        ),
      ),
    )

    const { result } = renderHook(() => useDistributeAvatars(), { wrapper })
    result.current.mutate({ botIds: [1], bodyUris: ["body://a"] })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["virtual-crew", "bots"],
    })
  })

  it("distribute 실패 시 invalidate 하지 않는다", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    server.use(
      http.post("*/api/v1/admin/virtual-crew/bots/avatar/distribute", () =>
        HttpResponse.json(
          { status: 400, errorCode: null, message: "bad" },
          { status: 400 },
        ),
      ),
    )

    const { result } = renderHook(() => useDistributeAvatars(), { wrapper })
    result.current.mutate({ botIds: [1], bodyUris: ["body://a"] })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
