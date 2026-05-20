import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { GuestDetailCards } from "../guest-detail-cards"
import { guestDetailFixture } from "@/test/mocks/fixtures/guests"

describe("GuestDetailCards", () => {
  it("does NOT render mutation actions dropdown (read-only invariant)", () => {
    render(<GuestDetailCards detail={guestDetailFixture} />)
    expect(
      screen.queryByRole("button", { name: /작업/i }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText("등급 변경")).not.toBeInTheDocument()
    expect(screen.queryByText("비식별화 탈퇴")).not.toBeInTheDocument()
  })

  it("renders agent + isProfileUpdated + email + nickname", () => {
    render(<GuestDetailCards detail={guestDetailFixture} />)
    expect(screen.getByText(/Mozilla\/5\.0 fixture-ua/)).toBeInTheDocument()
    expect(screen.getByText(/프로필 완료 여부: Y/)).toBeInTheDocument()
    expect(screen.getByText(/guest-fixture@d8.local/)).toBeInTheDocument()
    expect(screen.getByText(/guestNick/)).toBeInTheDocument()
  })

  it("withdrawn=true → 탈퇴됨 배지 노출", () => {
    render(
      <GuestDetailCards
        detail={{
          ...guestDetailFixture,
          withdrawn: true,
          withdrawnAt: "2026-05-19T00:00:00",
        }}
      />,
    )
    expect(screen.getByText(/탈퇴됨/)).toBeInTheDocument()
  })

  it("recentActivityLog 빈 배열 → '활동 기록 없음' 노출", () => {
    render(
      <GuestDetailCards
        detail={{ ...guestDetailFixture, recentActivityLog: [] }}
      />,
    )
    expect(screen.getByText(/활동 기록 없음/)).toBeInTheDocument()
  })
})
