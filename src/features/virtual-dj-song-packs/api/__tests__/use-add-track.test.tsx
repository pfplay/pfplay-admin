import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { useAddTrack } from "../use-add-track"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

const VALID_TRACK = {
  name: "Song Title",
  linkId: "abc123",
  duration: "3:45",
  thumbnailImage: "https://img.example/thumb.jpg",
}

describe("useAddTrack", () => {
  afterEach(() => vi.restoreAllMocks())

  it("트랙 추가 성공 시 song-pack 상세 + song-packs 목록을 모두 invalidate 한다", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    server.use(
      http.post("*/api/v1/admin/virtual-dj/song-packs/5/tracks", () =>
        HttpResponse.json({ data: { id: 1 } }, { status: 201 }),
      ),
    )

    const { result } = renderHook(() => useAddTrack(5), { wrapper })
    result.current.mutate(VALID_TRACK)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["virtual-dj", "song-pack", 5],
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["virtual-dj", "song-packs"],
    })
  })

  it("트랙 추가 실패 시 invalidate 하지 않는다", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    server.use(
      http.post("*/api/v1/admin/virtual-dj/song-packs/5/tracks", () =>
        HttpResponse.json(
          { status: 400, errorCode: null, message: "bad" },
          { status: 400 },
        ),
      ),
    )

    const { result } = renderHook(() => useAddTrack(5), { wrapper })
    result.current.mutate(VALID_TRACK)
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
