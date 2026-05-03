import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster, toast } from "sonner"
import { MembersPage } from "../members-page"
import { memberSummaryFixture } from "@/test/mocks/fixtures/members"

function wrap(initial = "/members") {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="/members" element={<MembersPage />} />
          <Route
            path="/members/:memberId"
            element={<div data-testid="detail">detail</div>}
          />
        </Routes>
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("MembersPage integration", () => {
  it("happy: 마운트 → list 로드 → 회원 row 노출 → row click → /members/:id", async () => {
    wrap()
    await waitFor(() =>
      expect(screen.getByText(memberSummaryFixture.email)).toBeInTheDocument(),
    )
    fireEvent.click(screen.getByText(memberSummaryFixture.email))
    await waitFor(() =>
      expect(screen.getByTestId("detail")).toBeInTheDocument(),
    )
  })

  it("URL `/members?tier=FM` → backend로 전달 → 빈 결과", async () => {
    wrap("/members?tier=FM")
    await waitFor(() =>
      expect(screen.getByText(/회원이 없습니다/)).toBeInTheDocument(),
    )
  })

  it("URL `/members?email=` (255자 초과) → invalid drop + toast", async () => {
    const longEmail = "a".repeat(256)
    const toastSpy = vi.spyOn(toast, "error")
    try {
      wrap(`/members?email=${longEmail}`)
      // toast 호출 검증 — sonner 포털 렌더는 jsdom 타이밍에 민감하므로 spy로 체크
      await waitFor(() =>
        expect(toastSpy).toHaveBeenCalledWith("필터 일부가 잘못돼 무시했어요"),
      )
      // 정정 후 list 정상 로드 (default query)
      await waitFor(() =>
        expect(screen.getByText(memberSummaryFixture.email)).toBeInTheDocument(),
      )
    } finally {
      toastSpy.mockRestore()
    }
  })
})
