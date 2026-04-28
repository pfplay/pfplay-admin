import { describe, expect, it, vi, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PartyroomsActionsDropdown } from "@/features/partyrooms/ui/partyrooms-actions-dropdown"
import type { AdminPartyroomDetail } from "@/entities/partyroom/model/types"

const baseDetail: AdminPartyroomDetail = {
  partyroomId: 1,
  title: "테스트",
  status: "ACTIVE",
  displayFlag: "NORMAL",
  hostUserAccountId: 100,
  hostNickname: "alice",
  hostEmail: "alice@example.com",
  crewCount: 5,
  lastActivityAt: null,
  stageType: "GENERAL",
  playback: { activated: false, currentTrackName: null, currentDjCrewId: null },
  crews: [],
  djQueue: [],
  recentPenalties: [],
  recentReports: [],
  recentAdminActions: [],
}

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient()
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe("PartyroomsActionsDropdown — status-aware disabled", () => {
  afterEach(() => vi.restoreAllMocks())

  it("ACTIVE: 일시 정지 enabled, 재개 disabled, 강제 종료 enabled", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithClient(
      <PartyroomsActionsDropdown partyroom={{ ...baseDetail, status: "ACTIVE" }} />,
    )
    await user.click(screen.getByRole("button", { name: /actions/i }))

    expect(await screen.findByRole("menuitem", { name: /일시 정지/ })).not.toHaveAttribute(
      "data-disabled",
    )
    expect(screen.getByRole("menuitem", { name: /재개/ })).toHaveAttribute("data-disabled")
    expect(screen.getByRole("menuitem", { name: /강제 종료/ })).not.toHaveAttribute(
      "data-disabled",
    )
  })

  it("SUSPENDED: 일시 정지 disabled, 재개 enabled, 강제 종료 enabled", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithClient(
      <PartyroomsActionsDropdown partyroom={{ ...baseDetail, status: "SUSPENDED" }} />,
    )
    await user.click(screen.getByRole("button", { name: /actions/i }))

    expect(await screen.findByRole("menuitem", { name: /일시 정지/ })).toHaveAttribute(
      "data-disabled",
    )
    expect(screen.getByRole("menuitem", { name: /재개/ })).not.toHaveAttribute("data-disabled")
    expect(screen.getByRole("menuitem", { name: /강제 종료/ })).not.toHaveAttribute(
      "data-disabled",
    )
  })

  it("TERMINATED: all 3 lifecycle items disabled", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithClient(
      <PartyroomsActionsDropdown partyroom={{ ...baseDetail, status: "TERMINATED" }} />,
    )
    await user.click(screen.getByRole("button", { name: /actions/i }))

    expect(await screen.findByRole("menuitem", { name: /일시 정지/ })).toHaveAttribute(
      "data-disabled",
    )
    expect(screen.getByRole("menuitem", { name: /재개/ })).toHaveAttribute("data-disabled")
    expect(screen.getByRole("menuitem", { name: /강제 종료/ })).toHaveAttribute(
      "data-disabled",
    )
  })

  it("clicking enabled 강제 종료 opens terminate dialog", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithClient(
      <PartyroomsActionsDropdown partyroom={{ ...baseDetail, status: "ACTIVE" }} />,
    )
    await user.click(screen.getByRole("button", { name: /actions/i }))
    await user.click(await screen.findByRole("menuitem", { name: /강제 종료/ }))
    expect(screen.getByText(/파티룸 강제 종료/)).toBeInTheDocument()
  })

  it("clicking enabled 재개 on SUSPENDED opens restore dialog", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithClient(
      <PartyroomsActionsDropdown partyroom={{ ...baseDetail, status: "SUSPENDED" }} />,
    )
    await user.click(screen.getByRole("button", { name: /actions/i }))
    await user.click(await screen.findByRole("menuitem", { name: /재개/ }))
    expect(screen.getByText(/파티룸 재개/)).toBeInTheDocument()
  })
})
