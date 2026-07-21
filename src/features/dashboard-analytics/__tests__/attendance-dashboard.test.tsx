import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AttendanceDashboard } from "../ui/attendance-dashboard"
import { getAttendanceAnalytics } from "../api/attendance-api"
import type { AttendanceAnalyticsResponse } from "../model/types"

vi.mock("../api/attendance-api", () => ({
  getAttendanceAnalytics: vi.fn(),
}))
const apiMock = vi.mocked(getAttendanceAnalytics)

const RESPONSE: AttendanceAnalyticsResponse = {
  days: 7,
  excludeBots: true,
  summary: {
    totalEntered: 42,
    totalExited: 40,
    uniqueVisitors: 17,
    activeRoomCount: 5,
    exitRecordRate: 0.952,
  },
  daily: [
    { date: "2026-07-20", entered: 20, exited: 19, uniqueVisitors: 9 },
    { date: "2026-07-21", entered: 22, exited: 21, uniqueVisitors: 11 },
  ],
}

function renderDashboard() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <AttendanceDashboard />
    </QueryClientProvider>,
  )
}

describe("AttendanceDashboard (#39)", () => {
  beforeEach(() => {
    apiMock.mockReset()
    apiMock.mockResolvedValue(RESPONSE)
  })

  it("KPI 타일 4종 렌더 — 총입장/순방문자/활성방/퇴장기록률(%)", async () => {
    renderDashboard()
    await waitFor(() => expect(screen.getByText("42")).toBeInTheDocument())
    expect(screen.getByText("총 입장")).toBeInTheDocument()
    expect(screen.getByText("17")).toBeInTheDocument()
    expect(screen.getByText("활성 방")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
    expect(screen.getByText("95%")).toBeInTheDocument() // round(0.952*100)
  })

  it("기본 호출 — days=7, excludeBots=true(봇 제외 기본 ON)", async () => {
    renderDashboard()
    await waitFor(() => expect(apiMock).toHaveBeenCalled())
    expect(apiMock).toHaveBeenCalledWith(7, true)
  })

  it("봇 제외 해제 → excludeBots=false 로 재조회", async () => {
    renderDashboard()
    await waitFor(() => expect(apiMock).toHaveBeenCalled())
    fireEvent.click(screen.getByLabelText("봇 제외"))
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith(7, false))
  })

  it("기간 14일 선택 → days=14 로 재조회", async () => {
    renderDashboard()
    await waitFor(() => expect(apiMock).toHaveBeenCalled())
    fireEvent.click(screen.getByRole("button", { name: "14일" }))
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith(14, true))
  })

  it("일별 미니바 — 날짜·입장/퇴장/순방문 라벨 렌더", async () => {
    renderDashboard()
    await waitFor(() => expect(screen.getByText("입장 20")).toBeInTheDocument())
    expect(screen.getByText("퇴장 19")).toBeInTheDocument()
    expect(screen.getByText("순방문 9")).toBeInTheDocument()
    expect(screen.getByText("07-21")).toBeInTheDocument()
  })

  it("빈 daily → 안내 문구", async () => {
    apiMock.mockResolvedValue({ ...RESPONSE, daily: [], summary: { ...RESPONSE.summary } })
    renderDashboard()
    await waitFor(() =>
      expect(screen.getByText("기간 내 입퇴장 데이터가 없습니다.")).toBeInTheDocument(),
    )
  })

  it("exitRecordRate=null → '—' 표기", async () => {
    apiMock.mockResolvedValue({
      ...RESPONSE,
      summary: { ...RESPONSE.summary, totalEntered: 0, exitRecordRate: null },
    })
    renderDashboard()
    await waitFor(() => expect(screen.getByText("—")).toBeInTheDocument())
  })
})
