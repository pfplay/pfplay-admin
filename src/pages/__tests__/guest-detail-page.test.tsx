import { describe, it, expect } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { GuestDetailPage } from "../guest-detail-page"
import { guestDetailFixture } from "@/test/mocks/fixtures/guests"

function wrap(initial: string) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="/guests/:guestId" element={<GuestDetailPage />} />
          <Route
            path="/members"
            element={<div data-testid="list">list</div>}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("GuestDetailPage integration", () => {
  it("happy: /guests/5001 → useGuestDetail → GuestDetailCards 렌더 + agent/nickname 노출", async () => {
    wrap("/guests/5001")
    await waitFor(() =>
      expect(
        screen.getByText(
          new RegExp(guestDetailFixture.userAccount.email.replace(/\./g, "\\.")),
        ),
      ).toBeInTheDocument(),
    )
    expect(
      screen.getByText(new RegExp(guestDetailFixture.agent!)),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        new RegExp(`닉네임: ${guestDetailFixture.profile.nickname}`),
      ),
    ).toBeInTheDocument()
    expect(screen.getByText(/프로필 완료 여부: Y/)).toBeInTheDocument()
  })

  it("404: /guests/9999 → '존재하지 않는 게스트' + 목록으로 버튼", async () => {
    wrap("/guests/9999")
    await waitFor(() =>
      expect(screen.getByText(/존재하지 않는 게스트/)).toBeInTheDocument(),
    )
    const backLink = screen.getByRole("link", { name: "목록으로" })
    expect(backLink).toHaveAttribute("href", "/members?tab=guest")
  })

  it("invalid guestId (NaN): /guests/abc → NotFoundView 노출", async () => {
    wrap("/guests/abc")
    expect(screen.getByText(/존재하지 않는 게스트/)).toBeInTheDocument()
    const backLink = screen.getByRole("link", { name: "목록으로" })
    expect(backLink).toHaveAttribute("href", "/members?tab=guest")
  })

  it("read-only invariant: 작업/등급변경/탈퇴 버튼 부재 (회귀 가드)", async () => {
    wrap("/guests/5001")
    await waitFor(() =>
      expect(
        screen.getByText(
          new RegExp(guestDetailFixture.userAccount.email.replace(/\./g, "\\.")),
        ),
      ).toBeInTheDocument(),
    )
    expect(
      screen.queryByRole("button", { name: /작업/i }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText("등급 변경")).not.toBeInTheDocument()
    expect(screen.queryByText("비식별화 탈퇴")).not.toBeInTheDocument()
  })

  it("← 목록으로 링크는 /members?tab=guest 로 복귀", async () => {
    wrap("/guests/5001")
    await waitFor(() =>
      expect(
        screen.getByText(
          new RegExp(guestDetailFixture.userAccount.email.replace(/\./g, "\\.")),
        ),
      ).toBeInTheDocument(),
    )
    const backLink = screen.getByRole("link", { name: /목록으로/ })
    expect(backLink).toHaveAttribute("href", "/members?tab=guest")
  })
})
