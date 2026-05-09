import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { AdministratorsFilterForm } from "../administrators-filter-form"

describe("AdministratorsFilterForm", () => {
  it("includeRevoked checkbox 토글 → onChange({ includeRevoked: true })", () => {
    const onChange = vi.fn()
    render(
      <AdministratorsFilterForm
        query={{}}
        onChange={onChange}
        onReset={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByLabelText("회수된 어드민 포함"))
    expect(onChange).toHaveBeenCalledWith({ includeRevoked: true })
  })

  it("초기화 버튼 → onReset", () => {
    const onReset = vi.fn()
    render(
      <AdministratorsFilterForm
        query={{ role: "ADMIN" }}
        onChange={vi.fn()}
        onReset={onReset}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: "초기화" }))
    expect(onReset).toHaveBeenCalled()
  })
})
