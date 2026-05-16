import { describe, expect, it, vi, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { toast } from "sonner"
import { useExpelCrew } from "@/features/partyrooms/api/use-expel-crew"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

describe("useExpelCrew", () => {
  afterEach(() => vi.restoreAllMocks())

  it("on success: invalidates ['partyrooms'] prefix, toast.success", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    const successSpy = vi.spyOn(toast, "success").mockImplementation(() => "")
    server.use(
      http.post("*/api/v1/admin/partyrooms/3/penalties", () =>
        HttpResponse.json({ data: { penaltyId: null } }, { status: 201 }),
      ),
    )

    const { result } = renderHook(() => useExpelCrew(), { wrapper })
    result.current.mutate({ partyroomId: 3, crewId: 14, reason: "cleanup" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["partyrooms"] })
    expect(successSpy).toHaveBeenCalledWith("크루 강퇴 완료")
  })

  it("on 403: mutationErrorToast", async () => {
    const { wrapper } = makeWrapper()
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "")
    server.use(
      http.post("*/api/v1/admin/partyrooms/3/penalties", () =>
        HttpResponse.json(
          { status: 403, errorCode: "ALREADY_TERMINATED", message: "이미 종료됨" },
          { status: 403 },
        ),
      ),
    )

    const { result } = renderHook(() => useExpelCrew(), { wrapper })
    result.current.mutate({ partyroomId: 3, crewId: 14, reason: "x" })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(errorSpy).toHaveBeenCalledWith(
      "이미 종료됨",
      expect.objectContaining({
        description: expect.stringContaining("ALREADY_TERMINATED"),
      }),
    )
  })
})
