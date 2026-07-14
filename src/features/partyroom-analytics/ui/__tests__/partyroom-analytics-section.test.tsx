import { describe, it, expect } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { PartyroomAnalyticsSection } from "../partyroom-analytics-section"

function analyticsBody(days: number) {
  return {
    data: {
      windowDays: days,
      attendance: {
        totalEntered: 30,
        totalExited: 22,
        uniqueVisitors: 18,
        daily: [
          { date: "2026-07-13", entered: 12, exited: 8 },
          { date: "2026-07-14", entered: 18, exited: 14 },
        ],
      },
      silenceExit: {
        approximate: true,
        totalExits: 22,
        exitsDuringSilence: 11,
        silenceExitRatio: 0.5,
        totalSilenceMinutes: 40,
      },
    },
  }
}

function djHistoryBody() {
  return {
    data: {
      content: [
        {
          playbackId: 1,
          trackName: "노래 하나",
          djUserAccountId: 100,
          djNickname: "루나",
          avatarIconUri: "",
          thumbnailImage: "",
          playedAt: "2026-07-14T10:00:00",
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      first: true,
      last: true,
      empty: false,
      numberOfElements: 1,
    },
  }
}

function mockEndpoints(onAnalytics?: (days: string | null) => void) {
  server.use(
    http.get("*/api/v1/admin/partyrooms/:id/analytics", ({ request }) => {
      const days = new URL(request.url).searchParams.get("days")
      onAnalytics?.(days)
      return HttpResponse.json(analyticsBody(Number(days)))
    }),
    http.get("*/api/v1/admin/partyrooms/:id/dj-history", () =>
      HttpResponse.json(djHistoryBody()),
    ),
  )
}

function renderSection() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <PartyroomAnalyticsSection partyroomId={7} />
    </QueryClientProvider>,
  )
}

describe("PartyroomAnalyticsSection", () => {
  it("요약 타일·일별 추이·무음이탈 비율·디제잉 이력을 렌더한다", async () => {
    mockEndpoints()
    renderSection()

    await waitFor(() => expect(screen.getByText("총 입장")).toBeInTheDocument())
    // 순 방문자 값
    expect(screen.getByText("18")).toBeInTheDocument()
    // 무음 이탈 비율 0.5 → 50%
    expect(screen.getByText("50%")).toBeInTheDocument()
    // 일별 추이(입장 값 노출)
    expect(screen.getByText(/입장 18/)).toBeInTheDocument()
    // 디제잉 이력 행
    expect(screen.getByText("노래 하나")).toBeInTheDocument()
    expect(screen.getByText("루나")).toBeInTheDocument()
  })

  it("기간 토글(7일) 시 days=7 로 재조회한다", async () => {
    let lastDays: string | null = null
    mockEndpoints((days) => {
      lastDays = days
    })
    renderSection()
    await waitFor(() => expect(screen.getByText("총 입장")).toBeInTheDocument())
    expect(lastDays).toBe("20") // 기본 20일

    await userEvent.click(screen.getByRole("button", { name: "7일" }))
    await waitFor(() => expect(lastDays).toBe("7"))
  })

  it("분석 로드 실패 시 안내", async () => {
    server.use(
      http.get("*/api/v1/admin/partyrooms/:id/analytics", () =>
        HttpResponse.json({ message: "boom" }, { status: 500 }),
      ),
      http.get("*/api/v1/admin/partyrooms/:id/dj-history", () =>
        HttpResponse.json(djHistoryBody()),
      ),
    )
    renderSection()
    await waitFor(() =>
      expect(
        screen.getByText(/행동 분석을 불러오지 못했습니다/),
      ).toBeInTheDocument(),
    )
  })
})
