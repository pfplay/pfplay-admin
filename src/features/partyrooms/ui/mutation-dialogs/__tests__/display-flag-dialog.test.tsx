import { describe, expect, it, vi, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { DisplayFlagDialog } from "@/features/partyrooms/ui/mutation-dialogs/display-flag-dialog"

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

// Note: 실제 Select interaction 테스트는 Dialog + radix Select 조합이 jsdom에서
// hang하는 환경 한계로 생략. Select interaction은 partyrooms-filter-form.test.tsx에서
// 이미 검증됨. Dialog 내 Select 통합은 수동 검증으로 cover (G6 catch-up).
describe("DisplayFlagDialog", () => {
  afterEach(() => vi.restoreAllMocks())

  it("renders title with current flag", () => {
    renderWithClient(
      <DisplayFlagDialog
        partyroomId={1}
        currentFlag="NORMAL"
        open={true}
        onOpenChange={vi.fn()}
      />,
    )
    expect(screen.getByText(/파티룸 표시 변경/)).toBeInTheDocument()
    expect(screen.getByText("NORMAL")).toBeInTheDocument()
  })

  it("disables submit when current flag selected (initial state)", () => {
    renderWithClient(
      <DisplayFlagDialog
        partyroomId={1}
        currentFlag="FEATURED"
        open={true}
        onOpenChange={vi.fn()}
      />,
    )
    expect(screen.getByRole("button", { name: "변경" })).toBeDisabled()
  })

  it("does not render when open=false", () => {
    renderWithClient(
      <DisplayFlagDialog
        partyroomId={1}
        currentFlag="NORMAL"
        open={false}
        onOpenChange={vi.fn()}
      />,
    )
    expect(screen.queryByText(/파티룸 표시 변경/)).not.toBeInTheDocument()
  })
})
