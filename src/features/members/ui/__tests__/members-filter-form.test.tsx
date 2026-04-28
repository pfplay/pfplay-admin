import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MembersFilterForm } from "../members-filter-form"
import type { MembersListQuery } from "../../model/filter-schema"

const baseQuery: MembersListQuery = { page: 0, size: 50, sort: "created_at_desc" }

describe("MembersFilterForm", () => {
  it("이메일 입력 → 300ms 후 onChange({ email, page: 0 })", async () => {
    vi.useFakeTimers()
    try {
      const onChange = vi.fn()
      render(
        <MembersFilterForm query={baseQuery} onChange={onChange} onReset={vi.fn()} />,
      )
      fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "alice" } })
      expect(onChange).not.toHaveBeenCalled()
      await act(async () => {
        vi.advanceTimersByTime(300)
      })
      expect(onChange).toHaveBeenCalledWith({ email: "alice", page: 0 })
    } finally {
      vi.useRealTimers()
    }
  })

  it("정렬 dropdown 변경 → 즉시 onChange({ sort, page: 0 })", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    const onChange = vi.fn()
    render(
      <MembersFilterForm query={baseQuery} onChange={onChange} onReset={vi.fn()} />,
    )
    await user.click(screen.getByRole("combobox", { name: /정렬/ }))
    await user.click(await screen.findByRole("option", { name: "가입일 ↑" }))
    expect(onChange).toHaveBeenCalledWith({ sort: "created_at_asc", page: 0 })
  })

  it("초기화 클릭 → onReset()", () => {
    const onReset = vi.fn()
    render(
      <MembersFilterForm query={baseQuery} onChange={vi.fn()} onReset={onReset} />,
    )
    fireEvent.click(screen.getByText("초기화"))
    expect(onReset).toHaveBeenCalled()
  })
})
