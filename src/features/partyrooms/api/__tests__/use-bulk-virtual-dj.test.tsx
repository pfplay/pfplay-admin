import { describe, expect, it, vi, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { toast } from "sonner"
import { useBulkVirtualDj } from "@/features/partyrooms/api/use-bulk-virtual-dj"
import type { VirtualDjBulkRequest } from "@/features/partyrooms/model/virtual-dj-bulk-schema"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

const body: VirtualDjBulkRequest = {
  partyroomIds: [1, 2, 3],
  status: "MANAGED",
  targetCount: 5,
  companionFloor: 1,
  songPackId: 3,
}

describe("useBulkVirtualDj", () => {
  afterEach(() => vi.restoreAllMocks())

  it("on success: invalidates ['partyrooms'], toast.success with count", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    const successSpy = vi.spyOn(toast, "success").mockImplementation(() => "")
    server.use(
      http.put("*/api/v1/admin/virtual-dj/bulk", () => new HttpResponse(null, { status: 204 })),
    )

    const { result } = renderHook(() => useBulkVirtualDj(), { wrapper })
    result.current.mutate(body)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["partyrooms"] })
    expect(successSpy).toHaveBeenCalledWith("가상 DJ 일괄 적용 완료 (3건)")
  })

  it("on 400 error: does NOT invalidate", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    vi.spyOn(toast, "error").mockImplementation(() => "")
    server.use(
      http.put("*/api/v1/admin/virtual-dj/bulk", () =>
        HttpResponse.json(
          { status: 400, errorCode: "VALIDATION_ERROR", message: "검증 실패" },
          { status: 400 },
        ),
      ),
    )

    const { result } = renderHook(() => useBulkVirtualDj(), { wrapper })
    result.current.mutate(body)
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
