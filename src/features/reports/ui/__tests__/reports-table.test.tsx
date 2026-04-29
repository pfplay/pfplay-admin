import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { ReportsTable } from "../reports-table"
import { reportSummaryFixture } from "@/test/mocks/fixtures/reports"

describe("ReportsTable", () => {
  it("renders rows with status badge + category 한국어", () => {
    render(
      <MemoryRouter>
        <ReportsTable
          rows={[
            reportSummaryFixture,
            { ...reportSummaryFixture, reportId: 2, category: "HARASSMENT" },
          ]}
          isLoading={false}
          isEmpty={false}
        />
      </MemoryRouter>,
    )
    expect(screen.getAllByText("PENDING")).toHaveLength(2)
    expect(screen.getByText("부적절 컨텐츠")).toBeInTheDocument()
    expect(screen.getByText("괴롭힘")).toBeInTheDocument()
  })

  it("renders empty 메시지", () => {
    render(
      <MemoryRouter>
        <ReportsTable rows={[]} isLoading={false} isEmpty={true} />
      </MemoryRouter>,
    )
    expect(screen.getByText(/신고가 없습니다/)).toBeInTheDocument()
  })

  it("renders skeleton when isLoading", () => {
    const { container } = render(
      <MemoryRouter>
        <ReportsTable rows={[]} isLoading={true} isEmpty={false} />
      </MemoryRouter>,
    )
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(5)
  })

  it("row click → /reports/:id 라우팅", () => {
    render(
      <MemoryRouter initialEntries={["/reports"]}>
        <Routes>
          <Route
            path="/reports"
            element={
              <ReportsTable
                rows={[reportSummaryFixture]}
                isLoading={false}
                isEmpty={false}
              />
            }
          />
          <Route path="/reports/:reportId" element={<div>detail</div>} />
        </Routes>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText("PENDING"))
    expect(screen.getByText("detail")).toBeInTheDocument()
  })

  it("reviewer/resolved null → '-' fallback", () => {
    render(
      <MemoryRouter>
        <ReportsTable
          rows={[reportSummaryFixture]}
          isLoading={false}
          isEmpty={false}
        />
      </MemoryRouter>,
    )
    // reviewedByAdministratorId / resolvedAt 둘 다 null in fixture
    const cells = screen.getAllByRole("cell")
    expect(cells.some((c) => c.textContent === "-")).toBe(true)
  })
})
