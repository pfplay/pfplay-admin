import { describe, it, expect } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { useGuestDetail } from "../use-guest-detail"
import type { AdminGuestDetail } from "@/entities/guest"
import { ApiError } from "@/shared/api/error"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

const detail: AdminGuestDetail = {
  guestId: 42,
  userAccount: {
    userAccountId: 9001,
    email: "g42@d8.local",
    providerType: "GOOGLE",
    lastLoginAt: "2026-05-15T10:00:00",
    withdrawnAt: null,
  },
  profile: { nickname: "g42-nick", introduction: null },
  agent: "ua-42",
  isProfileUpdated: true,
  createdAt: "2026-05-10T00:00:00",
  withdrawn: false,
  withdrawnAt: null,
  recentActivityLog: [],
}

describe("useGuestDetail", () => {
  it("returns AdminGuestDetail from GET /api/v1/admin/guests/:id", async () => {
    server.use(
      http.get("*/api/v1/admin/guests/42", () =>
        HttpResponse.json({ data: detail }),
      ),
    )
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useGuestDetail(42), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.guestId).toBe(42)
    expect(result.current.data?.profile.nickname).toBe("g42-nick")
  })

  it("404 → query.isError + ApiError instance", async () => {
    server.use(
      http.get("*/api/v1/admin/guests/9999", () =>
        HttpResponse.json(
          {
            status: 404,
            errorCode: "GUEST_NOT_FOUND",
            message: "존재하지 않는 게스트",
          },
          { status: 404 },
        ),
      ),
    )
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useGuestDetail(9999), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ApiError)
  })
})
