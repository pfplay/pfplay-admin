import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TransitionStatusDialog } from "../transition-status-dialog"

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe("TransitionStatusDialog", () => {
  afterEach(() => vi.restoreAllMocks())

  it("non-terminal target (REVIEWING) → 텍스트 영역 미렌더, submit 즉시 enabled", () => {
    renderWithClient(
      <TransitionStatusDialog
        reportId={1}
        currentStatus="PENDING"
        target="REVIEWING"
        open={true}
        onOpenChange={vi.fn()}
      />,
    )
    expect(screen.queryByRole("textbox", { name: /처리 메모/ })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "처리" })).not.toBeDisabled()
  })

  it("terminal target (RESOLVED) → textarea 필수 + 빈 상태 submit disabled", () => {
    renderWithClient(
      <TransitionStatusDialog
        reportId={1}
        currentStatus="REVIEWING"
        target="RESOLVED"
        open={true}
        onOpenChange={vi.fn()}
      />,
    )
    expect(screen.getByRole("textbox", { name: /처리 메모/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "처리" })).toBeDisabled()
  })

  it("terminal + note 입력 → submit enabled + onOpenChange(false) on success", async () => {
    const onOpenChange = vi.fn()
    renderWithClient(
      <TransitionStatusDialog
        reportId={1}
        currentStatus="REVIEWING"
        target="DISMISSED"
        open={true}
        onOpenChange={onOpenChange}
      />,
    )
    fireEvent.change(screen.getByRole("textbox", { name: /처리 메모/ }), {
      target: { value: "스팸 신고 — 기각" },
    })
    expect(screen.getByRole("button", { name: "처리" })).not.toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: "처리" }))
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it("title에 transition target 명시 + description에 current → target", () => {
    renderWithClient(
      <TransitionStatusDialog
        reportId={1}
        currentStatus="PENDING"
        target="DISMISSED"
        open={true}
        onOpenChange={vi.fn()}
      />,
    )
    expect(screen.getByText(/신고 처리.*기각/)).toBeInTheDocument()
    // description은 multi-element (<strong>)이라 별도 검증
    expect(screen.getByText("보류", { exact: false })).toBeInTheDocument()
    expect(screen.getAllByText(/기각/).length).toBeGreaterThan(0)
  })

  it("does not render when open=false", () => {
    renderWithClient(
      <TransitionStatusDialog
        reportId={1}
        currentStatus="PENDING"
        target="REVIEWING"
        open={false}
        onOpenChange={vi.fn()}
      />,
    )
    expect(screen.queryByText(/신고 처리/)).not.toBeInTheDocument()
  })

  it("whitespace-only note (terminal) → submit disabled", () => {
    renderWithClient(
      <TransitionStatusDialog
        reportId={1}
        currentStatus="REVIEWING"
        target="RESOLVED"
        open={true}
        onOpenChange={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByRole("textbox", { name: /처리 메모/ }), {
      target: { value: "   \n  \t  " },
    })
    expect(screen.getByRole("button", { name: "처리" })).toBeDisabled()
  })
})
