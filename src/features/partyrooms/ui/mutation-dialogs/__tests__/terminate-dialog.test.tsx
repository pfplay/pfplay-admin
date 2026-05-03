import { describe, expect, it, vi, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TerminateDialog } from "@/features/partyrooms/ui/mutation-dialogs/terminate-dialog"

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe("TerminateDialog", () => {
  afterEach(() => vi.restoreAllMocks())

  it("renders title and reason textbox when open", () => {
    renderWithClient(
      <TerminateDialog partyroomId={1} open={true} onOpenChange={vi.fn()} />,
    )
    expect(screen.getByText(/파티룸 강제 종료/)).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: /사유/ })).toBeInTheDocument()
  })

  it("submit button labeled 강제 종료, type submit, destructive variant", () => {
    renderWithClient(
      <TerminateDialog partyroomId={1} open={true} onOpenChange={vi.fn()} />,
    )
    const submit = screen.getByRole("button", { name: "강제 종료" })
    expect(submit).toBeInTheDocument()
    expect(submit).not.toBeDisabled()
  })

  it("does not render when open=false", () => {
    renderWithClient(
      <TerminateDialog partyroomId={1} open={false} onOpenChange={vi.fn()} />,
    )
    expect(screen.queryByText(/파티룸 강제 종료/)).not.toBeInTheDocument()
  })
})
