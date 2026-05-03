import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { toast } from "sonner"
import { BulkActionDialog } from "../bulk-action-dialog"

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

const baseProps = {
  selectedIds: [1, 2, 3],
  open: true,
  onOpenChange: () => {},
  onResults: () => {},
}

// Note: Dialog 내부 Action Select user.click은 14c §14 entry 14 jsdom hang.
// Action 변경 흐름은 e2e Playwright로 cover (§13.1 상속). default action=TERMINATE 흐름만 검증.
describe("BulkActionDialog", () => {
  afterEach(() => vi.restoreAllMocks())

  it("renders title with selection count", () => {
    renderWithClient(<BulkActionDialog {...baseProps} />)
    expect(screen.getByText(/일괄 처리.*3건/)).toBeInTheDocument()
  })

  it("submit button labeled '일괄 처리' + disabled when reason empty", () => {
    renderWithClient(<BulkActionDialog {...baseProps} />)
    expect(
      screen.getByRole("button", { name: "일괄 처리" }),
    ).toBeDisabled()
  })

  it("reason 입력 → submit enabled", () => {
    renderWithClient(<BulkActionDialog {...baseProps} />)
    fireEvent.change(screen.getByRole("textbox", { name: /사유/ }), {
      target: { value: "abuse" },
    })
    expect(screen.getByRole("button", { name: "일괄 처리" })).not.toBeDisabled()
  })

  it("skipErrors checkbox 기본 checked", () => {
    renderWithClient(<BulkActionDialog {...baseProps} />)
    expect(
      screen.getByRole("checkbox", { name: /실패 시.*계속/ }),
    ).toHaveAttribute("data-state", "checked")
  })

  it("does not render when open=false", () => {
    renderWithClient(<BulkActionDialog {...baseProps} open={false} />)
    expect(screen.queryByText(/일괄 처리.*3건/)).not.toBeInTheDocument()
  })

  it("전체 성공 → onResults(results) + onOpenChange(false) + toast.success (spec §4.3 always-call)", async () => {
    const onOpenChange = vi.fn()
    const onResults = vi.fn()
    const successSpy = vi.spyOn(toast, "success").mockImplementation(() => "")
    server.use(
      http.post("*/api/v1/admin/partyrooms/bulk-action", () =>
        HttpResponse.json({
          results: [
            { partyroomId: 1, success: true, error: null },
            { partyroomId: 2, success: true, error: null },
            { partyroomId: 3, success: true, error: null },
          ],
        }),
      ),
    )

    renderWithClient(
      <BulkActionDialog
        {...baseProps}
        onOpenChange={onOpenChange}
        onResults={onResults}
      />,
    )
    fireEvent.change(screen.getByRole("textbox", { name: /사유/ }), {
      target: { value: "abuse" },
    })
    fireEvent.click(screen.getByRole("button", { name: "일괄 처리" }))

    await waitFor(() => expect(onResults).toHaveBeenCalledOnce())
    expect(onResults.mock.calls[0][0]).toHaveLength(3)
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(successSpy).toHaveBeenCalled()
  })

  it("부분 실패 → onResults(results) 호출 + onOpenChange(false)", async () => {
    const onOpenChange = vi.fn()
    const onResults = vi.fn()
    vi.spyOn(toast, "warning").mockImplementation(() => "")
    server.use(
      http.post("*/api/v1/admin/partyrooms/bulk-action", () =>
        HttpResponse.json({
          results: [
            { partyroomId: 1, success: true, error: null },
            { partyroomId: 2, success: false, error: "이미 종료" },
            { partyroomId: 3, success: true, error: null },
          ],
        }),
      ),
    )

    renderWithClient(
      <BulkActionDialog
        {...baseProps}
        onOpenChange={onOpenChange}
        onResults={onResults}
      />,
    )
    fireEvent.change(screen.getByRole("textbox", { name: /사유/ }), {
      target: { value: "abuse" },
    })
    fireEvent.click(screen.getByRole("button", { name: "일괄 처리" }))

    await waitFor(() => expect(onResults).toHaveBeenCalledOnce())
    expect(onResults.mock.calls[0][0]).toHaveLength(3)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
