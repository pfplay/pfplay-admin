import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemberDetailCards } from "../member-detail-cards"
import { memberDetailFixture } from "@/test/mocks/fixtures/members"

describe("MemberDetailCards", () => {
  it("withdrawn=true → 탈퇴 badge", () => {
    render(
      <MemberDetailCards
        detail={memberDetailFixture}
        withdrawn={true}
        withdrawnAt="2026-04-20T10:00:00"
      />,
    )
    expect(screen.getByText(/탈퇴 회원/)).toBeInTheDocument()
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
