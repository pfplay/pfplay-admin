import { describe, expect, it, vi, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { toast } from "sonner"
import { useTerminatePartyroom } from "@/features/partyrooms/api/use-terminate-partyroom"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

describe("useTerminatePartyroom", () => {
  afterEach(() => vi.restoreAllMocks())

  it("on success: invalidates ['partyrooms'] prefix, toast.success", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    const successSpy = vi.spyOn(toast, "success").mockImplementation(() => "")
    server.use(
      http.post("*/api/v1/admin/partyrooms/1/terminate", () => new HttpResponse(null, { status: 204 })),
    )

    const { result } = renderHook(() => useTerminatePartyroom(), { wrapper })
    result.current.mutate({ partyroomId: 1, reason: "abuse" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["partyrooms"] })
    expect(successSpy).toHaveBeenCalledWith("강제 종료 완료")
  })

  it("on 403 ALREADY_TERMINATED: mutationErrorToast", async () => {
    const { wrapper } = makeWrapper()
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "")
    server.use(
      http.post("*/api/v1/admin/partyrooms/1/terminate", () =>
        HttpResponse.json(
          { status: 403, errorCode: "ALREADY_TERMINATED", message: "이미 종료됨" },
          { status: 403 },
        ),
      ),
    )

    const { result } = renderHook(() => useTerminatePartyroom(), { wrapper })
    result.current.mutate({ partyroomId: 1, reason: "x" })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(errorSpy).toHaveBeenCalledWith(
      "이미 종료됨",
      expect.objectContaining({
        description: expect.stringContaining("ALREADY_TERMINATED"),
      }),
    )
  })
})
