import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { PartyroomDetailCards } from "../partyroom-detail-cards"
import { partyroomDetailFixture } from "@/test/mocks/fixtures/partyrooms"

describe("PartyroomDetailCards (G7 partial — 5/8 카드)", () => {
  it("currentTrackName=null → '-' fallback", () => {
    render(
      <MemoryRouter>
        <PartyroomDetailCards detail={partyroomDetailFixture} />
      </MemoryRouter>,
    )
    // fixture has currentTrackName=null → at least one '-' is rendered as playback fallback.
    expect(screen.getAllByText("-").length).toBeGreaterThan(0)
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
})
