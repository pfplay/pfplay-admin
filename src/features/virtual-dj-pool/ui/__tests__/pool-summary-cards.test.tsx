import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { PoolSummaryCards } from "../pool-summary-cards"
import type { PoolSummary } from "@/entities/virtual-dj"

const summary: PoolSummary = {
  total: 12,
  idle: 5,
  placed: [
    { partyroomId: 1, partyroomTitle: "메인 라운지", botCount: 4 },
    { partyroomId: 2, partyroomTitle: "서브 룸", botCount: 3 },
  ],
}

function renderCards(s: PoolSummary) {
  return render(
    <MemoryRouter>
      <PoolSummaryCards summary={s} />
    </MemoryRouter>,
  )
}

describe("PoolSummaryCards", () => {
  it("total / idle / placed 수치 렌더", () => {
    renderCards(summary)
    expect(screen.getByText("12")).toBeInTheDocument() // total
    expect(screen.getByText("5")).toBeInTheDocument() // idle
    // placed count = 2 rooms
    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("placed 각 룸 제목 + botCount 렌더 + 파티룸 링크", () => {
    renderCards(summary)
    expect(screen.getByText("메인 라운지")).toBeInTheDocument()
    expect(screen.getByText("서브 룸")).toBeInTheDocument()
    const link = screen.getByRole("link", { name: /메인 라운지/ })
    expect(link).toHaveAttribute("href", "/partyrooms/1")
  })

  it("placed 비어있으면 안내 문구", () => {
    renderCards({ total: 3, idle: 3, placed: [] })
    expect(screen.getByText(/배치된 봇이 없습니다/)).toBeInTheDocument()
  })
})
