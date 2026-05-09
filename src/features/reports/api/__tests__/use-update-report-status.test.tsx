import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { toast } from "sonner"
import { useUpdateReportStatus } from "@/features/reports/api/use-update-report-status"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

describe("useUpdateReportStatus", () => {
  afterEach(() => vi.restoreAllMocks())

  it("setQueryData(detail) + invalidate(list) + toast.success ('처리 완료')", async () => {
    const { qc, wrapper } = makeWrapper()
    const setSpy = vi.spyOn(qc, "setQueryData")
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    const successSpy = vi.spyOn(toast, "success").mockImplementation(() => "")

    const { result } = renderHook(() => useUpdateReportStatus(), { wrapper })
    result.current.mutate({
      reportId: 1,
      body: { status: "RESOLVED", resolutionNote: "ok" },
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(setSpy).toHaveBeenCalledWith(
      ["reports", "detail", 1],
      expect.objectContaining({ status: "RESOLVED" }),
    )
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["reports", "list"] })
    expect(successSpy).toHaveBeenCalledWith("처리 완료")
  })

  it("REVIEWING transition → toast '검토 시작'", async () => {
    const { wrapper } = makeWrapper()
    const successSpy = vi.spyOn(toast, "success").mockImplementation(() => "")

    const { result } = renderHook(() => useUpdateReportStatus(), { wrapper })
    result.current.mutate({ reportId: 1, body: { status: "REVIEWING" } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(successSpy).toHaveBeenCalledWith("검토 시작")
  })

  it("DISMISSED transition → toast '기각 처리'", async () => {
    const { wrapper } = makeWrapper()
    const successSpy = vi.spyOn(toast, "success").mockImplementation(() => "")

    const { result } = renderHook(() => useUpdateReportStatus(), { wrapper })
    result.current.mutate({
      reportId: 1,
      body: { status: "DISMISSED", resolutionNote: "spam" },
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(successSpy).toHaveBeenCalledWith("기각 처리")
  })

  it("400 RPT-002 → setQueryData/invalidate 미호출 + mutationErrorToast", async () => {
    const { qc, wrapper } = makeWrapper()
    const setSpy = vi.spyOn(qc, "setQueryData")
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "")
    server.use(
      http.patch("*/api/v1/admin/reports/1", () =>
        HttpResponse.json(
          { status: 400, errorCode: "RPT-002", message: "전이 불가" },
          { status: 400 },
        ),
      ),
    )

    const { result } = renderHook(() => useUpdateReportStatus(), { wrapper })
    result.current.mutate({ reportId: 1, body: { status: "RESOLVED", resolutionNote: "x" } })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(setSpy).not.toHaveBeenCalled()
    expect(invalidateSpy).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalled()
  })
})
