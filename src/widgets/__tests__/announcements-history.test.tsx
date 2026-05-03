import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { AnnouncementsHistoryWidget } from "../announcements-history"
import { annAlreadyCancelledError } from "@/test/mocks/fixtures/announcements"

function renderWidget(initialPath = "/announcements/history") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/announcements/history" element={<AnnouncementsHistoryWidget />} />
          <Route path="/announcements" element={<div data-testid="launch-page">launch</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("AnnouncementsHistoryWidget", () => {
  afterEach(() => vi.restoreAllMocks())

  it("이력 로드 — fixture 3건 (활성 2 / 취소 1)", async () => {
    renderWidget()
    await waitFor(() => {
      expect(screen.getByText("정기 점검 안내")).toBeInTheDocument()
    })
    expect(screen.getByText("5월 이벤트 시작")).toBeInTheDocument()
    expect(screen.getByText("긴급 공지 — 취소됨")).toBeInTheDocument()
    // 취소된 공지 1건은 버튼 비활성
    const cancelledBtn = screen.getByRole("button", { name: "공지 #103 취소" })
    expect(cancelledBtn).toBeDisabled()
  })

  it("총 건수 표시 (Pagination)", async () => {
    renderWidget()
    await waitFor(() => {
      expect(screen.getByText("총 3건")).toBeInTheDocument()
    })
  })

  it("취소 버튼 → confirm 모달 → 확정 → 취소 mutation 호출", async () => {
    let deleteCalled = false
    server.use(
      http.delete("*/api/v1/admin/announcements/101", () => {
        deleteCalled = true
        return HttpResponse.json({ data: null })
      }),
    )
    renderWidget()
    await waitFor(() => {
      expect(screen.getByText("정기 점검 안내")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole("button", { name: "공지 #101 취소" }))
    expect(await screen.findByText("공지 취소")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "취소 확정" }))
    await waitFor(() => expect(deleteCalled).toBe(true))
  })

  it("ANN-002 ALREADY_CANCELLED — ApiError 흐름 (mutation 실패 시 모달 유지)", async () => {
    server.use(
      http.delete("*/api/v1/admin/announcements/101", () =>
        HttpResponse.json(annAlreadyCancelledError, { status: 409 }),
      ),
    )
    renderWidget()
    await waitFor(() => {
      expect(screen.getByText("정기 점검 안내")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole("button", { name: "공지 #101 취소" }))
    expect(await screen.findByText("공지 취소")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "취소 확정" }))
    // onError 후에도 dialog 는 닫지 않음 (onSuccess 만 close)
    await waitFor(() => {
      expect(screen.getByText("공지 취소")).toBeInTheDocument()
    })
  })

  it("발사 페이지 링크 → /announcements 로 이동", async () => {
    renderWidget()
    fireEvent.click(screen.getByRole("link", { name: /공지 발사/ }))
    await waitFor(() =>
      expect(screen.getByTestId("launch-page")).toBeInTheDocument(),
    )
  })
})
