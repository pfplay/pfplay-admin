import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { useSetBotAvatar } from "../use-set-bot-avatar"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

describe("useSetBotAvatar", () => {
  afterEach(() => vi.restoreAllMocks())

  it("set avatar 성공 시 bots 쿼리를 invalidate 한다", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    server.use(
      // PUT 은 http<void> 라 본문 없는 204 를 반환한다.
      http.put("*/api/v1/admin/virtual-crew/bots/7/avatar", () =>
        new HttpResponse(null, { status: 204 }),
      ),
    )

    const { result } = renderHook(() => useSetBotAvatar(), { wrapper })
    result.current.mutate({ userId: "7", avatarBodyUri: "body://x" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["virtual-crew", "bots"],
    })
  })

  it("set avatar 실패 시 invalidate 하지 않는다", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    server.use(
      http.put("*/api/v1/admin/virtual-crew/bots/7/avatar", () =>
        HttpResponse.json(
          { status: 400, errorCode: null, message: "bad" },
          { status: 400 },
        ),
      ),
    )

    const { result } = renderHook(() => useSetBotAvatar(), { wrapper })
    result.current.mutate({ userId: "7", avatarBodyUri: "body://x" })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
