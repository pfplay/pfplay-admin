import { describe, expect, it, vi, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ChangeTierDialog } from "@/features/members/ui/mutation-dialogs/change-tier-dialog"

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe("ChangeTierDialog", () => {
  afterEach(() => vi.restoreAllMocks())

  it("renders title with current tier", () => {
    renderWithClient(
      <ChangeTierDialog memberId={1} currentTier="AM" open={true} onOpenChange={vi.fn()} />,
    )
    expect(screen.getByText(/회원 등급 변경/)).toBeInTheDocument()
    expect(screen.getByText("AM")).toBeInTheDocument()
  })

  it("disables submit when selected tier matches currentTier (initial state)", () => {
    renderWithClient(
      <ChangeTierDialog memberId={1} currentTier="FM" open={true} onOpenChange={vi.fn()} />,
    )
    const submit = screen.getByRole("button", { name: "변경" })
    expect(submit).toBeDisabled()
  })

  it("does not render dialog content when open=false", () => {
    renderWithClient(
      <ChangeTierDialog memberId={1} currentTier="FM" open={false} onOpenChange={vi.fn()} />,
    )
    expect(screen.queryByText(/회원 등급 변경/)).not.toBeInTheDocument()
  })
})
