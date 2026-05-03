import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PartyroomsFilterForm } from "../partyrooms-filter-form"
import type { PartyroomsListQuery } from "../../model/filter-schema"

const baseQuery: PartyroomsListQuery = {
  page: 0,
  size: 50,
  sort: "createdAt,desc",
}

describe("PartyroomsFilterForm", () => {
  it("호스트 입력 → 300ms 후 onChange (2자 이상)", async () => {
    vi.useFakeTimers()
    try {
      const onChange = vi.fn()
      render(
        <PartyroomsFilterForm
          query={baseQuery}
          onChange={onChange}
          onReset={vi.fn()}
        />,
      )
      fireEvent.change(screen.getByPlaceholderText(/2자 이상/), {
        target: { value: "ali" },
      })
      expect(onChange).not.toHaveBeenCalled()
      await act(async () => {
        vi.advanceTimersByTime(300)
      })
      expect(onChange).toHaveBeenCalledWith({ host: "ali", page: 0 })
    } finally {
      vi.useRealTimers()
    }
  })

  it("정렬 dropdown 변경 → 즉시 onChange({ sort, page: 0 })", async () => {
    // jsdom + radix Select: pointer-events check + delay 비활성화 필요
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    const onChange = vi.fn()
    render(
      <PartyroomsFilterForm
        query={baseQuery}
        onChange={onChange}
        onReset={vi.fn()}
      />,
    )
    await user.click(screen.getByRole("combobox", { name: /정렬/ }))
    await user.click(await screen.findByRole("option", { name: "크루수 ↓" }))
    expect(onChange).toHaveBeenCalledWith({
      sort: "crewCount,desc",
      page: 0,
    })
  })

  it("초기화 클릭 → onReset()", () => {
    const onReset = vi.fn()
    render(
      <PartyroomsFilterForm
        query={baseQuery}
        onChange={vi.fn()}
        onReset={onReset}
      />,
    )
    fireEvent.click(screen.getByText("초기화"))
    expect(onReset).toHaveBeenCalled()
  })
})
