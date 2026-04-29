import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AvatarsActionsDropdown } from "../avatars-actions-dropdown"
import { bodyDraftFixture, bodyPublishedFixture, bodyRetiredFixture } from "@/test/mocks/fixtures/avatars"

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient()
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe("AvatarsActionsDropdown — lifecycle 분기", () => {
  afterEach(() => vi.restoreAllMocks())

  it("DRAFT: 게시 enabled, 회수 disabled", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithClient(
      <AvatarsActionsDropdown resource={bodyDraftFixture} resourceType="body" />,
    )
    await user.click(screen.getByRole("button", { name: /actions/i }))
    expect(await screen.findByRole("menuitem", { name: /게시/ })).not.toHaveAttribute(
      "data-disabled",
    )
    expect(screen.getByRole("menuitem", { name: /회수/ })).toHaveAttribute(
      "data-disabled",
    )
  })

  it("PUBLISHED: 게시 disabled, 회수 enabled", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithClient(
      <AvatarsActionsDropdown resource={bodyPublishedFixture} resourceType="body" />,
    )
    await user.click(screen.getByRole("button", { name: /actions/i }))
    expect(await screen.findByRole("menuitem", { name: /게시/ })).toHaveAttribute(
      "data-disabled",
    )
    expect(screen.getByRole("menuitem", { name: /회수/ })).not.toHaveAttribute(
      "data-disabled",
    )
  })

  it("RETIRED: 모두 disabled (terminal)", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithClient(
      <AvatarsActionsDropdown resource={bodyRetiredFixture} resourceType="body" />,
    )
    await user.click(screen.getByRole("button", { name: /actions/i }))
    const items = await screen.findAllByRole("menuitem")
    items.forEach((item) => expect(item).toHaveAttribute("data-disabled"))
  })

  it("DRAFT '게시' 클릭 → publish dialog open", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithClient(
      <AvatarsActionsDropdown resource={bodyDraftFixture} resourceType="body" />,
    )
    await user.click(screen.getByRole("button", { name: /actions/i }))
    await user.click(await screen.findByRole("menuitem", { name: /게시/ }))
    expect(screen.getByText(/Body 게시 — Body 1/)).toBeInTheDocument()
  })

  it("PUBLISHED '회수' 클릭 → retire dialog open (textarea 노출)", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithClient(
      <AvatarsActionsDropdown
        resource={bodyPublishedFixture}
        resourceType="body"
      />,
    )
    await user.click(screen.getByRole("button", { name: /actions/i }))
    await user.click(await screen.findByRole("menuitem", { name: /회수/ }))
    expect(screen.getByText(/Body 회수 — Body 2/)).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: /회수 사유/ })).toBeInTheDocument()
  })
})
