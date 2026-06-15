import { describe, expect, it, vi, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { toast } from "sonner"
import { useApplyVirtualDj } from "@/features/partyrooms/api/use-apply-virtual-dj"
import type { VirtualDjConfigRequest } from "@/features/partyrooms/model/virtual-dj-config-schema"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

const body: VirtualDjConfigRequest = {
  status: "MANAGED",
  targetCount: 5,
  companionFloor: 1,
  songPackId: 3,
}

describe("useApplyVirtualDj", () => {
  afterEach(() => vi.restoreAllMocks())

  it("on success: invalidates ['virtual-dj','room',id] and ['partyrooms'], toast.success", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    const successSpy = vi.spyOn(toast, "success").mockImplementation(() => "")
    server.use(
      http.put("*/api/v1/admin/partyrooms/5/virtual-dj", () => new HttpResponse(null, { status: 204 })),
    )

    const { result } = renderHook(() => useApplyVirtualDj(5), { wrapper })
    result.current.mutate(body)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["virtual-dj", "room", 5] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["partyrooms"] })
    expect(successSpy).toHaveBeenCalledWith("가상 DJ 설정 적용 완료")
  })

  it("on 409 error: does NOT invalidate", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    vi.spyOn(toast, "error").mockImplementation(() => "")
    server.use(
      http.put("*/api/v1/admin/partyrooms/5/virtual-dj", () =>
        HttpResponse.json(
          { status: 409, errorCode: "ILLEGAL_STATE_TRANSITION", message: "전이 불가" },
          { status: 409 },
        ),
      ),
    )

    const { result } = renderHook(() => useApplyVirtualDj(5), { wrapper })
    result.current.mutate(body)
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
