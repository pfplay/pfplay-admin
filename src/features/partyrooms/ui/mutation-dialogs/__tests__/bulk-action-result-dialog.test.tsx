import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BulkActionResultDialog } from "../bulk-action-result-dialog"
import type { BulkActionResult } from "@/features/partyrooms/model/bulk-schema"

function renderWithClient(
  ui: React.ReactNode,
  cacheRows: { partyroomId: number; title: string }[] = [],
) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  // cache prime — partyrooms list cache로 title lookup 시뮬
  qc.setQueryData(
    ["partyrooms", { page: 0, size: 50, sort: "createdAt,desc" }],
    {
      content: cacheRows.map((r) => ({
        partyroomId: r.partyroomId,
        title: r.title,
      })),
      totalElements: cacheRows.length,
    },
  )
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

const baseResults: BulkActionResult[] = [
  { partyroomId: 1, success: true, error: null },
  { partyroomId: 2, success: false, error: "이미 종료된 파티룸입니다" },
  { partyroomId: 3, success: false, error: "INTERNAL_ERROR" },
]

describe("BulkActionResultDialog", () => {
  afterEach(() => vi.restoreAllMocks())

  it("title — 성공 X건 / 실패 Y건", () => {
    renderWithClient(
      <BulkActionResultDialog
        results={baseResults}
        attemptedCount={3}
        open={true}
        onOpenChange={vi.fn()}
      />,
    )
    expect(screen.getByText(/성공 1건/)).toBeInTheDocument()
    expect(screen.getByText(/실패 2건/)).toBeInTheDocument()
  })

  it("성공 항목 미표시, 실패 항목만 list 렌더 + error message 노출", () => {
    renderWithClient(
      <BulkActionResultDialog
        results={baseResults}
        attemptedCount={3}
        open={true}
        onOpenChange={vi.fn()}
      />,
    )
    // 성공 row(partyroomId=1)는 list에 미표시
    const list = screen.getByRole("table")
    expect(list).not.toHaveTextContent(/^1$/m)
    expect(list).toHaveTextContent("이미 종료된 파티룸입니다")
    expect(list).toHaveTextContent("INTERNAL_ERROR")
  })

  it("title cache 존재 시 lookup 표시, 미존재 시 '(N/A)' fallback", () => {
    renderWithClient(
      <BulkActionResultDialog
        results={baseResults}
        attemptedCount={3}
        open={true}
        onOpenChange={vi.fn()}
      />,
      [{ partyroomId: 2, title: "테스트 파티룸 2" }],
    )
    expect(screen.getByText("테스트 파티룸 2")).toBeInTheDocument()
    expect(screen.getByText("(N/A)")).toBeInTheDocument() // partyroomId=3 cache 미존재
  })

  it("attemptedCount > results.length → 미시도 Z건 표시", () => {
    renderWithClient(
      <BulkActionResultDialog
        results={baseResults}
        attemptedCount={5}
        open={true}
        onOpenChange={vi.fn()}
      />,
    )
    expect(screen.getByText(/미시도 2건/)).toBeInTheDocument()
  })

  it("닫기 버튼 → onOpenChange(false)", () => {
    const onOpenChange = vi.fn()
    renderWithClient(
      <BulkActionResultDialog
        results={baseResults}
        attemptedCount={3}
        open={true}
        onOpenChange={onOpenChange}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: /닫기/ }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("does not render when open=false", () => {
    renderWithClient(
      <BulkActionResultDialog
        results={baseResults}
        attemptedCount={3}
        open={false}
        onOpenChange={vi.fn()}
      />,
    )
    expect(screen.queryByText(/실패 2건/)).not.toBeInTheDocument()
  })
})
