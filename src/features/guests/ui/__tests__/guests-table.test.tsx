import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { GuestsTable } from "../guests-table"
import type { AdminGuestSummary } from "@/entities/guest"

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return {
    ...actual,
    useNavigate: vi.fn(),
  }
})

import { useNavigate } from "react-router-dom"

const summary: AdminGuestSummary = {
  guestId: 5001,
  userAccountId: 6001,
  email: "guest-row@d8.local",
  providerType: "GOOGLE",
  nickname: "guestNick",
  agent: "Mozilla/5.0 fixture-ua",
  isProfileUpdated: false,
  lastLoginAt: "2026-05-15T10:00:00",
  createdAt: "2026-05-10T00:00:00",
  withdrawn: false,
  withdrawnAt: null,
}

const summaryWithdrawn: AdminGuestSummary = {
  ...summary,
  guestId: 5002,
  email: "guest-row-withdrawn@d8.local",
  withdrawn: true,
  withdrawnAt: "2026-05-19T00:00:00",
}

describe("GuestsTable", () => {
  beforeEach(() => {
    vi.mocked(useNavigate).mockReset()
  })

  it("loading=true → skeleton 렌더", () => {
    render(
      <MemoryRouter>
        <GuestsTable rows={[]} isLoading={true} isEmpty={false} />
      </MemoryRouter>,
    )
    // Skeleton uses data-slot="skeleton" — fall back to absence of table
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })

  it("isEmpty=true → 빈 안내 노출", () => {
    render(
      <MemoryRouter>
        <GuestsTable rows={[]} isLoading={false} isEmpty={true} />
      </MemoryRouter>,
    )
    expect(screen.getByText(/게스트가 없습니다/)).toBeInTheDocument()
  })

  it("row 렌더 + withdrawn badge / agent 컬럼 / tier 컬럼 부재", () => {
    render(
      <MemoryRouter>
        <GuestsTable
          rows={[summary, summaryWithdrawn]}
          isLoading={false}
          isEmpty={false}
        />
      </MemoryRouter>,
    )
    expect(screen.getByText(summary.email)).toBeInTheDocument()
    expect(screen.getByText("탈퇴됨")).toBeInTheDocument()
    expect(screen.getByText("활동 중")).toBeInTheDocument()
    expect(screen.getAllByText(/Mozilla\/5\.0 fixture-ua/)).toHaveLength(2)
    // tier filter / 권한 column 부재 (Decision #4)
    expect(screen.queryByText("권한")).not.toBeInTheDocument()
  })

  it("row click → navigate('/guests/{guestId}') (NOT /members/...)", () => {
    const nav = vi.fn()
    vi.mocked(useNavigate).mockReturnValue(nav)
    render(
      <MemoryRouter>
        <GuestsTable
          rows={[summary]}
          isLoading={false}
          isEmpty={false}
        />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText(summary.email))
    expect(nav).toHaveBeenCalledWith(`/guests/${summary.guestId}`)
    // members-table 복사 실수 가드: 절대 /members/... 가 아님
    expect(nav).not.toHaveBeenCalledWith(`/members/${summary.guestId}`)
  })
})
