import { describe, expect, it, vi, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { toast } from "sonner"
import { useChangeMemberTier } from "@/features/members/api/use-change-member-tier"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

describe("useChangeMemberTier", () => {
  afterEach(() => vi.restoreAllMocks())

  it("on success: invalidates ['members'] prefix, toast.success", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    const successSpy = vi.spyOn(toast, "success").mockImplementation(() => "")
    server.use(
      http.patch("*/api/v1/admin/members/1/tier", () =>
        HttpResponse.json({ data: { memberId: 1, oldTier: "AM", newTier: "FM" } }),
      ),
    )

    const { result } = renderHook(() => useChangeMemberTier(), { wrapper })
    result.current.mutate({ memberId: 1, tier: "FM" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["members"] })
    expect(successSpy).toHaveBeenCalled()
  })

  it("on ApiError: mutationErrorToast called", async () => {
    const { wrapper } = makeWrapper()
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "")
    server.use(
      http.patch("*/api/v1/admin/members/1/tier", () =>
        HttpResponse.json({ status: 400, errorCode: "TIER_UNCHANGED", message: "동일 등급" }, { status: 400 }),
      ),
    )

    const { result } = renderHook(() => useChangeMemberTier(), { wrapper })
    result.current.mutate({ memberId: 1, tier: "FM" })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(errorSpy).toHaveBeenCalledWith("동일 등급", {
      description: "code: TIER_UNCHANGED (status: 400)",
    })
  })
})
