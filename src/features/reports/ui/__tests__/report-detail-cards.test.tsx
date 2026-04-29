import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { ReportDetailCards } from "../report-detail-cards"
import {
  reportDetailFixture,
  reportDetailOrphanFixture,
} from "@/test/mocks/fixtures/reports"

describe("ReportDetailCards", () => {
  it("5 카드 렌더 + status badge + category 한국어", () => {
    render(
      <MemoryRouter>
        <ReportDetailCards detail={reportDetailFixture} />
      </MemoryRouter>,
    )
    expect(screen.getByText(/신고 #1/)).toBeInTheDocument()
    expect(screen.getByText("PENDING")).toBeInTheDocument()
    expect(screen.getByText("부적절 컨텐츠")).toBeInTheDocument()
    expect(screen.getByText("신고자")).toBeInTheDocument()
    expect(screen.getByText("파티룸")).toBeInTheDocument()
    expect(screen.getByText("신고 내용")).toBeInTheDocument()
    expect(screen.getByText("검토")).toBeInTheDocument()
  })

  it("PENDING 상태 → '검토 전' 표시", () => {
    render(
      <MemoryRouter>
        <ReportDetailCards detail={reportDetailFixture} />
      </MemoryRouter>,
    )
    expect(screen.getByText("검토 전")).toBeInTheDocument()
  })

  it("orphan reporter → '(삭제된 회원)'", () => {
    render(
      <MemoryRouter>
        <ReportDetailCards detail={reportDetailOrphanFixture} />
      </MemoryRouter>,
    )
    expect(screen.getByText("(삭제된 회원)")).toBeInTheDocument()
  })

  it("orphan partyroom → '(삭제된 파티룸)'", () => {
    render(
      <MemoryRouter>
        <ReportDetailCards detail={reportDetailOrphanFixture} />
      </MemoryRouter>,
    )
    expect(screen.getByText(/삭제된 파티룸 — id: 999/)).toBeInTheDocument()
  })

  it("description whitespace-pre-wrap 보존", () => {
    render(
      <MemoryRouter>
        <ReportDetailCards detail={reportDetailFixture} />
      </MemoryRouter>,
    )
    const desc = screen.getByText(/부적절한 음악 트랙/)
    expect(desc.className).toContain("whitespace-pre-wrap")
  })

  it("partyroom 상세 링크 (orphan 아닐 때만 렌더)", () => {
    render(
      <MemoryRouter>
        <ReportDetailCards detail={reportDetailFixture} />
      </MemoryRouter>,
    )
    expect(screen.getByRole("link", { name: /파티룸 상세/ })).toHaveAttribute(
      "href",
      "/partyrooms/100",
    )
  })
})
