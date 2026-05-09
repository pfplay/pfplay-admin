import { describe, expect, it, vi, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { WithdrawDialog } from "@/features/members/ui/mutation-dialogs/withdraw-dialog"

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe("WithdrawDialog", () => {
  afterEach(() => vi.restoreAllMocks())

  it("displays member display name", () => {
    renderWithClient(
      <WithdrawDialog memberId={1} displayName="alice" open={true} onOpenChange={vi.fn()} />,
    )
    expect(screen.getByText(/alice/)).toBeInTheDocument()
  })

  it("submits and closes dialog on success", async () => {
    server.use(
      http.post("*/api/v1/admin/members/1/withdraw", () =>
        HttpResponse.json({
          data: {
            memberId: 1,
            userAccountId: 100,
            withdrawnAt: "2026-04-29T10:00:00",
            alreadyWithdrawn: false,
          },
        }),
      ),
    )
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithClient(
      <WithdrawDialog memberId={1} displayName="alice" open={true} onOpenChange={onOpenChange} />,
    )
    await user.click(screen.getByRole("button", { name: /탈퇴 처리/ }))
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })
})
