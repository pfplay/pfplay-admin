import { describe, it, expect } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemberDetailPage } from "../member-detail-page"
import { memberDetailFixture } from "@/test/mocks/fixtures/members"

function wrap(initial: string) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route
            path="/members/:memberId"
            element={<MemberDetailPage />}
          />
          <Route path="/members" element={<div data-testid="list">list</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("MemberDetailPage integration", () => {
  it("happy: /members/1 → detail 카드 + activity log", async () => {
    wrap("/members/1")
    await waitFor(() =>
      expect(
        screen.getByText(
          `#${memberDetailFixture.memberId} ${memberDetailFixture.profile.nickname}`,
        ),
      ).toBeInTheDocument(),
    )
    expect(
      screen.getByText(memberDetailFixture.userAccount.email),
    ).toBeInTheDocument()
  })

  it("404: /members/9999 → '존재하지 않는 회원' + 목록으로 버튼", async () => {
    wrap("/members/9999")
    await waitFor(() =>
      expect(screen.getByText(/존재하지 않는 회원/)).toBeInTheDocument(),
    )
    const backLink = screen.getByRole("link", { name: "목록으로" })
    expect(backLink).toHaveAttribute("href", "/members")
  })
})
