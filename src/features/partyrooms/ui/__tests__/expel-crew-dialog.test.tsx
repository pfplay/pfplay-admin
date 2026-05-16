import { describe, expect, it, vi, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { ExpelCrewDialog } from "@/features/partyrooms/ui/mutation-dialogs/expel-crew-dialog"

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>
}

describe("ExpelCrewDialog", () => {
  afterEach(() => vi.restoreAllMocks())

  it("submit disabled until valid reason", async () => {
    const u = userEvent.setup()
    render(
      wrap(
        <ExpelCrewDialog
          partyroomId={3}
          crewId={14}
          crewLabel="#14 회원 #99"
          open
          onOpenChange={() => {}}
        />,
      ),
    )
    const submit = screen.getByRole("button", { name: "강퇴" })
    expect(submit).toBeDisabled()
    await u.type(screen.getByLabelText("사유"), "cleanup")
    await waitFor(() => expect(submit).toBeEnabled())
  })

  it("on success calls onOpenChange(false) with correct payload", async () => {
    const u = userEvent.setup()
    let body: unknown
    server.use(
      http.post("*/api/v1/admin/partyrooms/3/penalties", async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ data: { penaltyId: null } }, { status: 201 })
      }),
    )
    const onOpenChange = vi.fn()
    render(
      wrap(
        <ExpelCrewDialog
          partyroomId={3}
          crewId={14}
          crewLabel="#14 회원 #99"
          open
          onOpenChange={onOpenChange}
        />,
      ),
    )
    await u.type(screen.getByLabelText("사유"), "cleanup")
    await u.click(screen.getByRole("button", { name: "강퇴" }))
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(body).toEqual({
      crewId: 14,
      penaltyType: "ONE_TIME_EXPULSION",
      reason: "cleanup",
    })
  })

  it("on error keeps dialog open (onOpenChange not called with false)", async () => {
    const u = userEvent.setup()
    vi.spyOn((await import("sonner")).toast, "error").mockImplementation(() => "")
    server.use(
      http.post("*/api/v1/admin/partyrooms/3/penalties", () =>
        HttpResponse.json(
          { status: 403, errorCode: "NOT_FOUND_ROOM", message: "없음" },
          { status: 403 },
        ),
      ),
    )
    const onOpenChange = vi.fn()
    render(
      wrap(
        <ExpelCrewDialog
          partyroomId={3}
          crewId={14}
          crewLabel="#14 회원 #99"
          open
          onOpenChange={onOpenChange}
        />,
      ),
    )
    await u.type(screen.getByLabelText("사유"), "x")
    await u.click(screen.getByRole("button", { name: "강퇴" }))
    await waitFor(() =>
      expect(onOpenChange).not.toHaveBeenCalledWith(false),
    )
  })
})
