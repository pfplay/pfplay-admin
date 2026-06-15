import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { useRemoveTrack } from "../use-remove-track"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

describe("useRemoveTrack", () => {
  afterEach(() => vi.restoreAllMocks())

  it("트랙 제거 성공 시 song-pack 상세 + song-packs 목록을 모두 invalidate 한다", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    server.use(
      http.delete(
        "*/api/v1/admin/virtual-dj/song-packs/5/tracks/9",
        () => new HttpResponse(null, { status: 204 }),
      ),
    )

    const { result } = renderHook(() => useRemoveTrack(5), { wrapper })
    result.current.mutate(9)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["virtual-dj", "song-pack", 5],
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["virtual-dj", "song-packs"],
    })
  })

  it("트랙 제거 실패 시 invalidate 하지 않는다", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    server.use(
      http.delete("*/api/v1/admin/virtual-dj/song-packs/5/tracks/9", () =>
        HttpResponse.json(
          { status: 404, errorCode: null, message: "not found" },
          { status: 404 },
        ),
      ),
    )

    const { result } = renderHook(() => useRemoveTrack(5), { wrapper })
    result.current.mutate(9)
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
