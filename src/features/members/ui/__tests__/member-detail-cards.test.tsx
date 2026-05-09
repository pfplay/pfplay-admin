import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemberDetailCards } from "../member-detail-cards"
import {
  memberDetailFixture,
  memberDetailWithdrawnFixture,
} from "@/test/mocks/fixtures/members"

describe("MemberDetailCards", () => {
  it("detail.withdrawn=true → 탈퇴 badge + withdrawnAt tooltip (G10 한글화)", () => {
    render(<MemberDetailCards detail={memberDetailWithdrawnFixture} />)
    const badge = screen.getByText("탈퇴됨")
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveAttribute("title", expect.stringContaining("탈퇴 처리:"))
  })

  it("detail.withdrawn=false → badge 미렌더", () => {
    render(<MemberDetailCards detail={memberDetailFixture} />)
    expect(screen.queryByText("탈퇴됨")).not.toBeInTheDocument()
  })

  it("recentActivityLog 빈 배열 → '최근 활동 없음'", () => {
    render(
      <MemberDetailCards
        detail={{ ...memberDetailFixture, recentActivityLog: [] }}
      />,
    )
    expect(screen.getByText("최근 활동 없음")).toBeInTheDocument()
  })
})
