import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { toast } from "sonner"
import { useBulkPartyroomAction } from "@/features/partyrooms/api/use-bulk-partyroom-action"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

describe("useBulkPartyroomAction", () => {
  afterEach(() => vi.restoreAllMocks())

  it("전체 성공 → invalidate ['partyrooms'] + toast.success", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    const successSpy = vi.spyOn(toast, "success").mockImplementation(() => "")
    server.use(
      http.post("*/api/v1/admin/partyrooms/bulk-action", () =>
        HttpResponse.json({
          results: [
            { partyroomId: 1, success: true, error: null },
            { partyroomId: 2, success: true, error: null },
          ],
        }),
      ),
    )

    const { result } = renderHook(() => useBulkPartyroomAction(), { wrapper })
    result.current.mutate({
      partyroomIds: [1, 2],
      action: "TERMINATE",
      reason: "x",
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["partyrooms"] })
    expect(successSpy).toHaveBeenCalledWith(expect.stringContaining("2건"))
  })

  it("부분 실패 → toast.warning(성공/실패 카운트)", async () => {
    const { wrapper } = makeWrapper()
    const warningSpy = vi.spyOn(toast, "warning").mockImplementation(() => "")
    server.use(
      http.post("*/api/v1/admin/partyrooms/bulk-action", () =>
        HttpResponse.json({
          results: [
            { partyroomId: 1, success: true, error: null },
            { partyroomId: 2, success: false, error: "이미 종료" },
          ],
        }),
      ),
    )

    const { result } = renderHook(() => useBulkPartyroomAction(), { wrapper })
    result.current.mutate({
      partyroomIds: [1, 2],
      action: "TERMINATE",
      reason: "x",
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(warningSpy).toHaveBeenCalledWith(
      expect.stringMatching(/성공.*1.*실패.*1/),
    )
  })

  it("전체 실패 → toast.error('전건 실패')", async () => {
    const { wrapper } = makeWrapper()
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "")
    server.use(
      http.post("*/api/v1/admin/partyrooms/bulk-action", () =>
        HttpResponse.json({
          results: [
            { partyroomId: 1, success: false, error: "X" },
            { partyroomId: 2, success: false, error: "Y" },
          ],
        }),
      ),
    )

    const { result } = renderHook(() => useBulkPartyroomAction(), { wrapper })
    result.current.mutate({
      partyroomIds: [1, 2],
      action: "TERMINATE",
      reason: "x",
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("전건 실패"))
  })

  it("HTTP 400 → mutationErrorToast (ApiError) + invalidate 미호출", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "")
    server.use(
      http.post("*/api/v1/admin/partyrooms/bulk-action", () =>
        HttpResponse.json(
          { status: 400, errorCode: "VALIDATION", message: "bad" },
          { status: 400 },
        ),
      ),
    )

    const { result } = renderHook(() => useBulkPartyroomAction(), { wrapper })
    result.current.mutate({
      partyroomIds: [1],
      action: "TERMINATE",
      reason: "x",
    })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalled()
  })
})
