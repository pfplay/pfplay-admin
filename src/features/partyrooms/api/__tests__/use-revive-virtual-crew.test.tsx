import { describe, expect, it, vi, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { toast } from "sonner"
import { useReviveVirtualCrew } from "@/features/partyrooms/api/use-revive-virtual-crew"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

describe("useReviveVirtualCrew", () => {
  afterEach(() => vi.restoreAllMocks())

  it("on success: invalidates ['virtual-crew','room',id] and ['partyrooms'], toast.success", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    const successSpy = vi.spyOn(toast, "success").mockImplementation(() => "")
    server.use(
      http.post("*/api/v1/admin/partyrooms/5/virtual-crew/revive", () => new HttpResponse(null, { status: 204 })),
    )

    const { result } = renderHook(() => useReviveVirtualCrew(5), { wrapper })
    result.current.mutate()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["virtual-crew", "room", 5] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["partyrooms"] })
    expect(successSpy).toHaveBeenCalledWith("봇 부활 완료")
  })

  it("on 409 error: does NOT invalidate", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    vi.spyOn(toast, "error").mockImplementation(() => "")
    server.use(
      http.post("*/api/v1/admin/partyrooms/5/virtual-crew/revive", () =>
        HttpResponse.json(
          { status: 409, errorCode: "ILLEGAL_STATE_TRANSITION", message: "전이 불가" },
          { status: 409 },
        ),
      ),
    )

    const { result } = renderHook(() => useReviveVirtualCrew(5), { wrapper })
    result.current.mutate()
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
