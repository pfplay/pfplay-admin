import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { BulkActionToolbar } from "../bulk-action-toolbar"

describe("BulkActionToolbar", () => {
  it("selectionSize === 0 → 미렌더", () => {
    const { container } = render(
      <BulkActionToolbar
        selectionSize={0}
        onClearSelection={vi.fn()}
        onOpenDialog={vi.fn()}
        onOpenVirtualDj={vi.fn()}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it("selectionSize === 1 → '선택: 1건' + 버튼 enabled", () => {
    render(
      <BulkActionToolbar
        selectionSize={1}
        onClearSelection={vi.fn()}
        onOpenDialog={vi.fn()}
        onOpenVirtualDj={vi.fn()}
      />,
    )
    expect(screen.getByText(/선택: 1건/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /일괄 처리/ })).not.toBeDisabled()
    expect(screen.getByRole("button", { name: /선택 해제/ })).not.toBeDisabled()
  })

  it("selectionSize > 100 → 경고 + 일괄 처리 disabled", () => {
    render(
      <BulkActionToolbar
        selectionSize={101}
        onClearSelection={vi.fn()}
        onOpenDialog={vi.fn()}
        onOpenVirtualDj={vi.fn()}
      />,
    )
    expect(screen.getByText(/100건 초과/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /일괄 처리/ })).toBeDisabled()
  })

  it("선택 해제 클릭 → onClearSelection 호출", () => {
    const onClearSelection = vi.fn()
    render(
      <BulkActionToolbar
        selectionSize={3}
        onClearSelection={onClearSelection}
        onOpenDialog={vi.fn()}
        onOpenVirtualDj={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: /선택 해제/ }))
    expect(onClearSelection).toHaveBeenCalledOnce()
  })

  it("일괄 처리 클릭 → onOpenDialog 호출", () => {
    const onOpenDialog = vi.fn()
    render(
      <BulkActionToolbar
        selectionSize={3}
        onClearSelection={vi.fn()}
        onOpenDialog={onOpenDialog}
        onOpenVirtualDj={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: /일괄 처리/ }))
    expect(onOpenDialog).toHaveBeenCalledOnce()
  })

  it("가상 DJ 설정 클릭 → onOpenVirtualDj 호출", () => {
    const onOpenVirtualDj = vi.fn()
    render(
      <BulkActionToolbar
        selectionSize={3}
        onClearSelection={vi.fn()}
        onOpenDialog={vi.fn()}
        onOpenVirtualDj={onOpenVirtualDj}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: /가상 DJ 설정/ }))
    expect(onOpenVirtualDj).toHaveBeenCalledOnce()
  })

  it("count 라인 role='status' (SR)", () => {
    render(
      <BulkActionToolbar
        selectionSize={5}
        onClearSelection={vi.fn()}
        onOpenDialog={vi.fn()}
        onOpenVirtualDj={vi.fn()}
      />,
    )
    expect(screen.getByRole("status")).toHaveTextContent(/5건/)
  })
})
