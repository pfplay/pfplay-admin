import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ReportsFilterForm } from "../reports-filter-form"
import type { ReportsListQuery } from "../../model/filter-schema"

const baseQuery: ReportsListQuery = {
  page: 0,
  size: 50,
  sort: "created_at_desc",
}

describe("ReportsFilterForm", () => {
  it("status checkbox click → onChange({ status: [PENDING], page: 0 })", () => {
    const onChange = vi.fn()
    render(<ReportsFilterForm query={baseQuery} onChange={onChange} onReset={vi.fn()} />)
    fireEvent.click(screen.getByRole("checkbox", { name: /상태 PENDING/ }))
    expect(onChange).toHaveBeenCalledWith({ status: ["PENDING"], page: 0 })
  })

  it("status checkbox 두 번째 click (이미 선택) → 제거 → undefined", () => {
    const onChange = vi.fn()
    render(
      <ReportsFilterForm
        query={{ ...baseQuery, status: ["PENDING"] }}
        onChange={onChange}
        onReset={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole("checkbox", { name: /상태 PENDING/ }))
    expect(onChange).toHaveBeenCalledWith({ status: undefined, page: 0 })
  })

  it("category checkbox 두 항목 multi 선택", () => {
    const onChange = vi.fn()
    render(
      <ReportsFilterForm
        query={{ ...baseQuery, category: ["SPAM"] }}
        onChange={onChange}
        onReset={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole("checkbox", { name: /카테고리 괴롭힘/ }))
    expect(onChange).toHaveBeenCalledWith({
      category: ["SPAM", "HARASSMENT"],
      page: 0,
    })
  })

  it("createdFrom 입력 → onChange({ createdFrom, page: 0 })", () => {
    const onChange = vi.fn()
    render(<ReportsFilterForm query={baseQuery} onChange={onChange} onReset={vi.fn()} />)
    fireEvent.change(screen.getByLabelText("시작일"), {
      target: { value: "2026-01-01" },
    })
    expect(onChange).toHaveBeenCalledWith({ createdFrom: "2026-01-01", page: 0 })
  })

  it("초기화 클릭 → onReset", () => {
    const onReset = vi.fn()
    render(
      <ReportsFilterForm
        query={baseQuery}
        onChange={vi.fn()}
        onReset={onReset}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: /초기화/ }))
    expect(onReset).toHaveBeenCalledOnce()
  })

  it("status 미선택 시 모든 status checkbox unchecked", () => {
    render(<ReportsFilterForm query={baseQuery} onChange={vi.fn()} onReset={vi.fn()} />)
    const checkboxes = screen.getAllByRole("checkbox", { name: /상태/ })
    checkboxes.forEach((c) => {
      expect(c).toHaveAttribute("data-state", "unchecked")
    })
  })
})
