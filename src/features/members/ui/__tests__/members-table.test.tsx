import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { MembersTable } from "../members-table"
import {
  memberSummaryFixture,
  memberSummaryWithdrawnFixture,
} from "@/test/mocks/fixtures/members"

describe("MembersTable", () => {
  it("loaded — row 노출 + withdrawn badge", () => {
    render(
      <MemoryRouter>
        <MembersTable
          rows={[memberSummaryFixture, memberSummaryWithdrawnFixture]}
          isLoading={false}
          isEmpty={false}
        />
      </MemoryRouter>,
    )
    expect(screen.getByText(memberSummaryFixture.email)).toBeInTheDocument()
    expect(screen.getByText("탈퇴")).toBeInTheDocument()
  })

  it("empty 상태 메시지", () => {
    render(
      <MemoryRouter>
        <MembersTable rows={[]} isLoading={false} isEmpty={true} />
      </MemoryRouter>,
    )
    expect(screen.getByText(/회원이 없습니다/)).toBeInTheDocument()
  })

  it("row click → /members/:id 라우팅", () => {
    render(
      <MemoryRouter initialEntries={["/members"]}>
        <Routes>
          <Route
            path="/members"
            element={
              <MembersTable
                rows={[memberSummaryFixture]}
                isLoading={false}
                isEmpty={false}
              />
            }
          />
          <Route path="/members/:id" element={<div>detail</div>} />
        </Routes>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText(memberSummaryFixture.email))
    expect(screen.getByText("detail")).toBeInTheDocument()
  })
})
