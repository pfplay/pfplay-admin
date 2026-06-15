import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { useCreateSongPack } from "../use-create-song-pack"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

describe("useCreateSongPack", () => {
  afterEach(() => vi.restoreAllMocks())

  it("생성 성공 시 song-packs 목록을 invalidate 한다", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    server.use(
      http.post("*/api/v1/admin/virtual-dj/song-packs", () =>
        HttpResponse.json({ data: { id: 1 } }, { status: 201 }),
      ),
    )

    const { result } = renderHook(() => useCreateSongPack(), { wrapper })
    result.current.mutate({ name: "pack", description: null })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["virtual-dj", "song-packs"],
    })
  })

  it("생성 실패 시 invalidate 하지 않는다", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    server.use(
      http.post("*/api/v1/admin/virtual-dj/song-packs", () =>
        HttpResponse.json(
          { status: 400, errorCode: null, message: "bad" },
          { status: 400 },
        ),
      ),
    )

    const { result } = renderHook(() => useCreateSongPack(), { wrapper })
    result.current.mutate({ name: "pack", description: null })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
