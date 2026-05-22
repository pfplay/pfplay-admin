import { describe, it, expect } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { useGuestsList } from "../use-guests-list"
import type { AdminGuestSummary } from "@/entities/guest"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

const summary: AdminGuestSummary = {
  guestId: 1,
  userAccountId: 100,
  email: "g1@d8.local",
  providerType: "GOOGLE",
  nickname: "g1",
  agent: "ua-1",
  isProfileUpdated: false,
  lastLoginAt: "2026-05-15T10:00:00",
  createdAt: "2026-05-10T00:00:00",
  withdrawn: false,
  withdrawnAt: null,
}

describe("useGuestsList", () => {
  it("returns Page<AdminGuestSummary> from GET /api/v1/admin/guests", async () => {
    server.use(
      http.get("*/api/v1/admin/guests", () =>
        HttpResponse.json({
          data: {
            content: [summary],
            totalElements: 1,
            totalPages: 1,
            number: 0,
            size: 50,
            first: true,
            last: true,
            empty: false,
            numberOfElements: 1,
          },
        }),
      ),
    )
    const { wrapper } = makeWrapper()
    const { result } = renderHook(
      () =>
        useGuestsList({
          page: 0,
          size: 50,
          sort: "created_at_desc",
        }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.content[0].email).toBe(summary.email)
    expect(result.current.data?.totalElements).toBe(1)
  })

  it("forwards query params to the request URL", async () => {
    let capturedUrl: URL | undefined
    server.use(
      http.get("*/api/v1/admin/guests", ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json({
          data: {
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: 0,
            size: 50,
            first: true,
            last: true,
            empty: true,
            numberOfElements: 0,
          },
        })
      }),
    )
    const { wrapper } = makeWrapper()
    const { result } = renderHook(
      () =>
        useGuestsList({
          email: "alice",
          joined_from: "2026-01-01",
          page: 0,
          size: 50,
          sort: "created_at_desc",
        }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(capturedUrl?.searchParams.get("email")).toBe("alice")
    expect(capturedUrl?.searchParams.get("joined_from")).toBe("2026-01-01")
  })
})
