import { describe, expect, it, vi, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { toast } from "sonner"
import { useSuspendPartyroom } from "@/features/partyrooms/api/use-suspend-partyroom"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

describe("useSuspendPartyroom", () => {
  afterEach(() => vi.restoreAllMocks())

  it("on success: invalidates ['partyrooms'] prefix, toast.success", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    const successSpy = vi.spyOn(toast, "success").mockImplementation(() => "")
    server.use(
      http.post("*/api/v1/admin/partyrooms/1/suspend", () => new HttpResponse(null, { status: 204 })),
    )

    const { result } = renderHook(() => useSuspendPartyroom(), { wrapper })
    result.current.mutate({ partyroomId: 1, reason: "review" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["partyrooms"] })
    expect(successSpy).toHaveBeenCalledWith("일시 정지 완료")
  })

  it("on 409 ILLEGAL_STATE_TRANSITION: mutationErrorToast", async () => {
    const { wrapper } = makeWrapper()
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "")
    server.use(
      http.post("*/api/v1/admin/partyrooms/1/suspend", () =>
        HttpResponse.json(
          { status: 409, errorCode: "ILLEGAL_STATE_TRANSITION", message: "전이 불가" },
          { status: 409 },
        ),
      ),
    )

    const { result } = renderHook(() => useSuspendPartyroom(), { wrapper })
    result.current.mutate({ partyroomId: 1, reason: "x" })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(errorSpy).toHaveBeenCalledWith(
      "전이 불가",
      expect.objectContaining({
        description: expect.stringContaining("ILLEGAL_STATE_TRANSITION"),
      }),
    )
  })
})
