import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReportsActionsDropdown } from "../reports-actions-dropdown"

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient()
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe("ReportsActionsDropdown — status별 menuitem disabled", () => {
  afterEach(() => vi.restoreAllMocks())

  it("PENDING: 검토 시작 + 기각 enabled, 처리 완료 / 보류 disabled", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithClient(
      <ReportsActionsDropdown reportId={1} currentStatus="PENDING" />,
    )
    await user.click(screen.getByRole("button", { name: '작업' }))
    expect(await screen.findByRole("menuitem", { name: "검토 시작" })).not.toHaveAttribute(
      "data-disabled",
    )
    expect(screen.getByRole("menuitem", { name: "기각" })).not.toHaveAttribute(
      "data-disabled",
    )
    expect(screen.getByRole("menuitem", { name: "처리 완료" })).toHaveAttribute(
      "data-disabled",
    )
    expect(screen.getByRole("menuitem", { name: "보류" })).toHaveAttribute(
      "data-disabled",
    )
  })

  it("REVIEWING: 처리 완료 / 기각 / 보류 enabled, 검토 시작 disabled", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithClient(
      <ReportsActionsDropdown reportId={1} currentStatus="REVIEWING" />,
    )
    await user.click(screen.getByRole("button", { name: '작업' }))
    expect(await screen.findByRole("menuitem", { name: "처리 완료" })).not.toHaveAttribute(
      "data-disabled",
    )
    expect(screen.getByRole("menuitem", { name: "기각" })).not.toHaveAttribute(
      "data-disabled",
    )
    expect(screen.getByRole("menuitem", { name: "보류" })).not.toHaveAttribute(
      "data-disabled",
    )
    expect(screen.getByRole("menuitem", { name: "검토 시작" })).toHaveAttribute(
      "data-disabled",
    )
  })

  it("RESOLVED: 모든 menuitem disabled", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithClient(
      <ReportsActionsDropdown reportId={1} currentStatus="RESOLVED" />,
    )
    await user.click(screen.getByRole("button", { name: '작업' }))
    const items = await screen.findAllByRole("menuitem")
    items.forEach((item) => expect(item).toHaveAttribute("data-disabled"))
  })

  it("clicking enabled '기각' on PENDING → opens dialog", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithClient(
      <ReportsActionsDropdown reportId={1} currentStatus="PENDING" />,
    )
    await user.click(screen.getByRole("button", { name: '작업' }))
    await user.click(await screen.findByRole("menuitem", { name: "기각" }))
    expect(screen.getByText(/신고 처리.*기각/)).toBeInTheDocument()
  })
})
