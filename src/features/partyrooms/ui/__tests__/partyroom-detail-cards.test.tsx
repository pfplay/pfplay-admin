import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { PartyroomDetailCards } from "../partyroom-detail-cards"
import { partyroomDetailFixture } from "@/test/mocks/fixtures/partyrooms"

describe("PartyroomDetailCards (G8 — 8/8 카드)", () => {
  it("currentTrackName=null → playback section '-' fallback", () => {
    render(
      <MemoryRouter>
        <PartyroomDetailCards detail={partyroomDetailFixture} />
      </MemoryRouter>,
    )
    // G7 review polish: scope assertion to playback section instead of loose getAllByText.
    // "현재 트랙" label is unique to playback card; its sibling div renders the fallback.
    const trackLabel = screen.getByText("현재 트랙")
    const trackValue = trackLabel.nextElementSibling
    expect(trackValue).not.toBeNull()
    expect(trackValue).toHaveTextContent("-")
  })

  it("crews 빈 배열 → '크루 없음'", () => {
    render(
      <MemoryRouter>
        <PartyroomDetailCards
          detail={{ ...partyroomDetailFixture, crews: [] }}
        />
      </MemoryRouter>,
    )
    expect(screen.getByText("크루 없음")).toBeInTheDocument()
  })

  it("status=TERMINATED → destructive badge 노출", () => {
    render(
      <MemoryRouter>
        <PartyroomDetailCards
          detail={{ ...partyroomDetailFixture, status: "TERMINATED" }}
        />
      </MemoryRouter>,
    )
    expect(screen.getByText("TERMINATED")).toBeInTheDocument()
  })

  it("introduction / playbackTimeLimit 행 표시 (G4.4)", () => {
    render(
      <MemoryRouter>
        <PartyroomDetailCards detail={partyroomDetailFixture} />
      </MemoryRouter>,
    )
    expect(screen.getByText("소개")).toBeInTheDocument()
    expect(screen.getByText("테스트 룸 소개")).toBeInTheDocument()
    expect(screen.getByText("재생 시간 제한")).toBeInTheDocument()
    expect(screen.getByText("30분")).toBeInTheDocument()
  })

  it("playbackTimeLimit=0 → '무제한', null → '-'", () => {
    const { rerender } = render(
      <MemoryRouter>
        <PartyroomDetailCards
          detail={{ ...partyroomDetailFixture, playbackTimeLimit: 0 }}
        />
      </MemoryRouter>,
    )
    expect(screen.getByText("무제한")).toBeInTheDocument()
    rerender(
      <MemoryRouter>
        <PartyroomDetailCards
          detail={{
            ...partyroomDetailFixture,
            playbackTimeLimit: null,
            introduction: null,
          }}
        />
      </MemoryRouter>,
    )
    // limit "-" + introduction "-" 둘 다 fallback. label로 좁혀 검증.
    const limitLabel = screen.getByText("재생 시간 제한")
    expect(limitLabel.nextElementSibling).toHaveTextContent("-")
  })

  it("recentPenalties / recentReports / recentAdminActions 모두 빈 → 각 빈 상태 메시지", () => {
    render(
      <MemoryRouter>
        <PartyroomDetailCards
          detail={{
            ...partyroomDetailFixture,
            recentPenalties: [],
            recentReports: [],
            recentAdminActions: [],
          }}
        />
      </MemoryRouter>,
    )
    expect(screen.getByText("최근 페널티 없음")).toBeInTheDocument()
    expect(screen.getByText("신고 내역 없음")).toBeInTheDocument()
    expect(screen.getByText("최근 관리자 액션 없음")).toBeInTheDocument()
  })

  it("recentReports 채움 → 행 노출 (ABUSE / #99)", () => {
    render(
      <MemoryRouter>
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
        />
      </MemoryRouter>,
    )
    expect(screen.getByText("ABUSE")).toBeInTheDocument()
    expect(screen.getByText("#99")).toBeInTheDocument()
  })
})
