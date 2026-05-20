import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { GuestsFilterForm } from "../guests-filter-form"
import type { GuestsListQuery } from "../../model/filter-schema"

const baseQuery: GuestsListQuery = {
  page: 0,
  size: 50,
  sort: "created_at_desc",
}

describe("GuestsFilterForm", () => {
  it("does NOT render tier select (Decision #4 — Guest 탭 tier filter 부재)", () => {
    render(
      <GuestsFilterForm
        query={baseQuery}
        onChange={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    expect(screen.queryByLabelText("권한")).not.toBeInTheDocument()
  })

  it("renders email / joined_from / joined_to / 정렬 inputs", () => {
    render(
      <GuestsFilterForm
        query={baseQuery}
        onChange={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    expect(screen.getByLabelText("이메일")).toBeInTheDocument()
    expect(screen.getByLabelText("가입일 from")).toBeInTheDocument()
    expect(screen.getByLabelText("가입일 to")).toBeInTheDocument()
    expect(screen.getByLabelText("정렬")).toBeInTheDocument()
  })

  it("이메일 입력 → 300ms 후 onChange({ email, page: 0 })", async () => {
    vi.useFakeTimers()
    try {
      const onChange = vi.fn()
      render(
        <GuestsFilterForm
          query={baseQuery}
          onChange={onChange}
          onReset={vi.fn()}
        />,
      )
      fireEvent.change(screen.getByLabelText("이메일"), {
        target: { value: "alice" },
      })
      expect(onChange).not.toHaveBeenCalled()
      await act(async () => {
        vi.advanceTimersByTime(300)
      })
      expect(onChange).toHaveBeenCalledWith({ email: "alice", page: 0 })
    } finally {
      vi.useRealTimers()
    }
  })

  it("가입일 from 변경 → 즉시 onChange({ joined_from, page: 0 })", () => {
    const onChange = vi.fn()
    render(
      <GuestsFilterForm
        query={baseQuery}
        onChange={onChange}
        onReset={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByLabelText("가입일 from"), {
      target: { value: "2026-01-01" },
    })
    expect(onChange).toHaveBeenCalledWith({
      joined_from: "2026-01-01",
      page: 0,
    })
  })

  it("정렬 dropdown 변경 → 즉시 onChange({ sort, page: 0 })", async () => {
    // jsdom + radix Select: pointer-events check + delay 비활성화 필요
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    const onChange = vi.fn()
    render(
      <GuestsFilterForm
        query={baseQuery}
        onChange={onChange}
        onReset={vi.fn()}
      />,
    )
    await user.click(screen.getByRole("combobox", { name: /정렬/ }))
    await user.click(await screen.findByRole("option", { name: "가입일 ↑" }))
    expect(onChange).toHaveBeenCalledWith({
      sort: "created_at_asc",
      page: 0,
    })
  })

  it("초기화 클릭 → onReset()", () => {
    const onReset = vi.fn()
    render(
      <GuestsFilterForm
        query={baseQuery}
        onChange={vi.fn()}
        onReset={onReset}
      />,
    )
    fireEvent.click(screen.getByText("초기화"))
    expect(onReset).toHaveBeenCalled()
  })
})
