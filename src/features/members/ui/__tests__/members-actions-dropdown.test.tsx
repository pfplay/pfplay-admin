import { describe, expect, it, vi, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MembersActionsDropdown } from "@/features/members/ui/members-actions-dropdown"

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient()
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe("MembersActionsDropdown", () => {
  afterEach(() => vi.restoreAllMocks())

  it("renders Actions trigger", () => {
    renderWithClient(
      <MembersActionsDropdown memberId={1} currentTier="AM" displayName="alice" />,
    )
    expect(screen.getByRole("button", { name: /actions/i })).toBeInTheDocument()
  })

  it("opens menu and triggers change-tier dialog", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithClient(
      <MembersActionsDropdown memberId={1} currentTier="AM" displayName="alice" />,
    )
    await user.click(screen.getByRole("button", { name: /actions/i }))
    await user.click(await screen.findByRole("menuitem", { name: /등급 변경/ }))
    expect(screen.getByText(/회원 등급 변경/)).toBeInTheDocument()
  })

  it("opens menu and triggers withdraw dialog", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithClient(
      <MembersActionsDropdown memberId={1} currentTier="AM" displayName="alice" />,
    )
    await user.click(screen.getByRole("button", { name: /actions/i }))
    await user.click(await screen.findByRole("menuitem", { name: /탈퇴/ }))
    expect(screen.getByText(/비식별화 탈퇴 처리/)).toBeInTheDocument()
  })

  it("withdrawn=true → 탈퇴 menuitem disabled + tooltip + dialog 미오픈", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithClient(
      <MembersActionsDropdown
        memberId={1}
        currentTier="AM"
        displayName="alice"
        withdrawn={true}
      />,
    )
    await user.click(screen.getByRole("button", { name: /actions/i }))
    const item = await screen.findByRole("menuitem", { name: /탈퇴/ })
    expect(item).toHaveAttribute("aria-disabled", "true")
    expect(item).toHaveAttribute("title", "이미 탈퇴됨")
    await user.click(item)
    expect(screen.queryByText(/비식별화 탈퇴 처리/)).not.toBeInTheDocument()
  })
})
