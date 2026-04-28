import { describe, expect, it, vi, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SuspendDialog } from "@/features/partyrooms/ui/mutation-dialogs/suspend-dialog"

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe("SuspendDialog", () => {
  afterEach(() => vi.restoreAllMocks())

  it("renders title and reason textbox when open", () => {
    renderWithClient(
      <SuspendDialog partyroomId={1} open={true} onOpenChange={vi.fn()} />,
    )
    expect(screen.getByText(/파티룸 일시 정지/)).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: /사유/ })).toBeInTheDocument()
  })

  it("submit button labeled 일시 정지", () => {
    renderWithClient(
      <SuspendDialog partyroomId={1} open={true} onOpenChange={vi.fn()} />,
    )
    expect(screen.getByRole("button", { name: "일시 정지" })).toBeInTheDocument()
  })

  it("does not render when open=false", () => {
    renderWithClient(
      <SuspendDialog partyroomId={1} open={false} onOpenChange={vi.fn()} />,
    )
    expect(screen.queryByText(/파티룸 일시 정지/)).not.toBeInTheDocument()
  })
})
