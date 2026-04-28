import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { Pagination } from "../pagination"

describe("Pagination", () => {
  it("totalElements=0 → 렌더 안 함", () => {
    const { container } = render(
      <Pagination page={0} totalPages={0} totalElements={0} onChange={vi.fn()} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it("page=0이면 prev disabled, page=last이면 next disabled", () => {
    render(<Pagination page={0} totalPages={3} totalElements={150} onChange={vi.fn()} />)
    const buttons = screen.getAllByRole("button")
    expect(buttons[0]).toBeDisabled() // prev
    expect(buttons[1]).not.toBeDisabled() // next
  })

  it("next 클릭 시 onChange(page+1)", () => {
    const onChange = vi.fn()
    render(<Pagination page={1} totalPages={3} totalElements={150} onChange={onChange} />)
    const buttons = screen.getAllByRole("button")
    fireEvent.click(buttons[1])
    expect(onChange).toHaveBeenCalledWith(2)
  })
})
