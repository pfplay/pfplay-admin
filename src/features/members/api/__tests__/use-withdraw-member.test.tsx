import { describe, expect, it, vi, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { toast } from "sonner"
import { useWithdrawMember } from "@/features/members/api/use-withdraw-member"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

describe("useWithdrawMember", () => {
  afterEach(() => vi.restoreAllMocks())

  it("on first withdrawal (alreadyWithdrawn=false): toast '탈퇴 처리 완료'", async () => {
    const { wrapper } = makeWrapper()
    const successSpy = vi.spyOn(toast, "success").mockImplementation(() => "")
    server.use(
      http.post("*/api/v1/admin/members/1/withdraw", () =>
        HttpResponse.json({
          data: { memberId: 1, userAccountId: 100, withdrawnAt: "2026-04-29T10:00:00", alreadyWithdrawn: false },
        }),
      ),
    )
    const { result } = renderHook(() => useWithdrawMember(), { wrapper })
    result.current.mutate({ memberId: 1 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(successSpy).toHaveBeenCalledWith("탈퇴 처리 완료")
  })

  it("on idempotent re-call (alreadyWithdrawn=true): toast.info '이미 탈퇴된 회원입니다' (G5.2)", async () => {
    const { wrapper } = makeWrapper()
    const successSpy = vi.spyOn(toast, "success").mockImplementation(() => "")
    const infoSpy = vi.spyOn(toast, "info").mockImplementation(() => "")
    server.use(
      http.post("*/api/v1/admin/members/1/withdraw", () =>
        HttpResponse.json({
          data: { memberId: 1, userAccountId: 100, withdrawnAt: "2026-04-20T12:00:00", alreadyWithdrawn: true },
        }),
      ),
    )
    const { result } = renderHook(() => useWithdrawMember(), { wrapper })
    result.current.mutate({ memberId: 1 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(infoSpy).toHaveBeenCalledWith("이미 탈퇴된 회원입니다")
    expect(successSpy).not.toHaveBeenCalled()
  })

  it("on success: invalidates ['members'] prefix", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    server.use(
      http.post("*/api/v1/admin/members/1/withdraw", () =>
        HttpResponse.json({
          data: { memberId: 1, userAccountId: 100, withdrawnAt: "2026-04-29T10:00:00", alreadyWithdrawn: false },
        }),
      ),
    )
    const { result } = renderHook(() => useWithdrawMember(), { wrapper })
    result.current.mutate({ memberId: 1 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["members"] })
  })
})
