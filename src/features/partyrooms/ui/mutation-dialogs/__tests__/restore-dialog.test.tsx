import { describe, expect, it, vi, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { RestoreDialog } from "@/features/partyrooms/ui/mutation-dialogs/restore-dialog"

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe("RestoreDialog", () => {
  afterEach(() => vi.restoreAllMocks())

  it("renders title when open", () => {
    renderWithClient(
      <RestoreDialog partyroomId={1} open={true} onOpenChange={vi.fn()} />,
    )
    expect(screen.getByText(/파티룸 재개/)).toBeInTheDocument()
  })

  it("submits and closes on success", async () => {
    server.use(
      http.post("*/api/v1/admin/partyrooms/1/restore", () => new HttpResponse(null, { status: 204 })),
    )
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithClient(
      <RestoreDialog partyroomId={1} open={true} onOpenChange={onOpenChange} />,
    )
    await user.click(screen.getByRole("button", { name: "재개" }))
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })
})
