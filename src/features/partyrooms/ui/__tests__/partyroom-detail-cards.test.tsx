import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PartyroomDetailCards } from "../partyroom-detail-cards"
import { partyroomDetailFixture } from "@/test/mocks/fixtures/partyrooms"

// CrewCard (section 4) now mounts ExpelCrewDialog → useExpelCrew → useQueryClient
// for every non-HOST crew row even while the dialog is closed, so every render
// of PartyroomDetailCards requires a QueryClientProvider. Wrapper only; no test
// logic / assertion changes.
function wrap(ui: React.ReactNode) {
  const qc = new QueryClient()
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe("PartyroomDetailCards (G8 — 8/8 카드)", () => {
  it("currentTrackName=null → playback section '-' fallback", () => {
    render(wrap(<PartyroomDetailCards detail={partyroomDetailFixture} />))
    // G7 review polish: scope assertion to playback section instead of loose getAllByText.
    // "현재 트랙" label is unique to playback card; its sibling div renders the fallback.
    const trackLabel = screen.getByText("현재 트랙")
    const trackValue = trackLabel.nextElementSibling
    expect(trackValue).not.toBeNull()
    expect(trackValue).toHaveTextContent("-")
  })

  it("crews 빈 배열 → '크루 없음'", () => {
    render(
      wrap(
        <PartyroomDetailCards
          detail={{ ...partyroomDetailFixture, crews: [] }}
        />,
      ),
    )
    expect(screen.getByText("크루 없음")).toBeInTheDocument()
  })

  it("status=TERMINATED → '종료됨' badge 노출 (한글화 G10)", () => {
    render(
      wrap(
        <PartyroomDetailCards
          detail={{ ...partyroomDetailFixture, status: "TERMINATED" }}
        />,
      ),
    )
    expect(screen.getByText("종료됨")).toBeInTheDocument()
  })

  it("introduction / playbackTimeLimit 행 표시 (G4.4)", () => {
    render(wrap(<PartyroomDetailCards detail={partyroomDetailFixture} />))
    expect(screen.getByText("소개")).toBeInTheDocument()
    expect(screen.getByText("테스트 룸 소개")).toBeInTheDocument()
    expect(screen.getByText("재생 시간 제한")).toBeInTheDocument()
    expect(screen.getByText("30분")).toBeInTheDocument()
  })

  it("playbackTimeLimit=0 → '무제한', null → '-'", () => {
    const { rerender } = render(
      wrap(
        <PartyroomDetailCards
          detail={{ ...partyroomDetailFixture, playbackTimeLimit: 0 }}
        />,
      ),
    )
    expect(screen.getByText("무제한")).toBeInTheDocument()
    rerender(
      wrap(
        <PartyroomDetailCards
          detail={{
            ...partyroomDetailFixture,
            playbackTimeLimit: null,
            introduction: null,
          }}
        />,
      ),
    )
    // limit "-" + introduction "-" 둘 다 fallback. label로 좁혀 검증.
    const limitLabel = screen.getByText("재생 시간 제한")
    expect(limitLabel.nextElementSibling).toHaveTextContent("-")
  })

  it("recentPenalties / recentReports / recentAdminActions 모두 빈 → 각 빈 상태 메시지", () => {
    render(
      wrap(
        <PartyroomDetailCards
          detail={{
            ...partyroomDetailFixture,
            recentPenalties: [],
            recentReports: [],
            recentAdminActions: [],
          }}
        />,
      ),
    )
    expect(screen.getByText("최근 페널티 없음")).toBeInTheDocument()
    expect(screen.getByText("신고 내역 없음")).toBeInTheDocument()
    expect(screen.getByText("최근 관리자 액션 없음")).toBeInTheDocument()
  })

  it("recentReports 채움 → 행 노출 (ABUSE / #99)", () => {
    render(
      wrap(
        <PartyroomDetailCards
          detail={{
            ...partyroomDetailFixture,
            recentReports: [
              {
                id: 1,
                category: "ABUSE",
                status: "PENDING",
                reporterUserAccountId: 99,
                createdAt: "2026-04-28T10:00:00",
              },
            ],
          }}
        />,
      ),
    )
    expect(screen.getByText("ABUSE")).toBeInTheDocument()
    expect(screen.getByText("#99")).toBeInTheDocument()
  })

  it("크루 카드에 강퇴 액션 컬럼 노출 (CrewCard 통합)", () => {
    render(wrap(<PartyroomDetailCards detail={partyroomDetailFixture} />))
    expect(
      screen.getByRole("columnheader", { name: "액션" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "강퇴" })).toBeEnabled()
  })
})
