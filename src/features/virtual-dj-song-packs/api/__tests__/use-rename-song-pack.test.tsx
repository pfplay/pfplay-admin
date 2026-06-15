import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { useRenameSongPack } from "../use-rename-song-pack"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

describe("useRenameSongPack", () => {
  afterEach(() => vi.restoreAllMocks())

  it("이름 변경 성공 시 song-packs 목록을 invalidate 한다", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    server.use(
      http.put(
        "*/api/v1/admin/virtual-dj/song-packs/5",
        () => new HttpResponse(null, { status: 204 }),
      ),
    )

    const { result } = renderHook(() => useRenameSongPack(), { wrapper })
    result.current.mutate({ id: 5, body: { name: "renamed" } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["virtual-dj", "song-packs"],
    })
  })

  it("이름 변경 실패 시 invalidate 하지 않는다", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    server.use(
      http.put("*/api/v1/admin/virtual-dj/song-packs/5", () =>
        HttpResponse.json(
          { status: 409, errorCode: null, message: "conflict" },
          { status: 409 },
        ),
      ),
    )

    const { result } = renderHook(() => useRenameSongPack(), { wrapper })
    result.current.mutate({ id: 5, body: { name: "renamed" } })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
