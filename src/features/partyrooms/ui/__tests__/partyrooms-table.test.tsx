import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { PartyroomsTable } from "../partyrooms-table"
import { partyroomListItemFixture } from "@/test/mocks/fixtures/partyrooms"

describe("PartyroomsTable", () => {
  it("loaded — title + status badge", () => {
    render(
      <MemoryRouter>
        <PartyroomsTable
          rows={[partyroomListItemFixture]}
          isLoading={false}
          isEmpty={false}
        />
      </MemoryRouter>,
    )
    expect(
      screen.getByText(partyroomListItemFixture.title),
    ).toBeInTheDocument()
    expect(screen.getByText("ACTIVE")).toBeInTheDocument()
  })

  it("empty 메시지", () => {
    render(
      <MemoryRouter>
        <PartyroomsTable rows={[]} isLoading={false} isEmpty={true} />
      </MemoryRouter>,
    )
    expect(screen.getByText(/파티룸이 없습니다/)).toBeInTheDocument()
  })

  it("row click → /partyrooms/:id 라우팅", () => {
    render(
      <MemoryRouter initialEntries={["/partyrooms"]}>
        <Routes>
          <Route
            path="/partyrooms"
            element={
              <PartyroomsTable
                rows={[partyroomListItemFixture]}
                isLoading={false}
                isEmpty={false}
              />
            }
          />
          <Route path="/partyrooms/:id" element={<div>detail</div>} />
        </Routes>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText(partyroomListItemFixture.title))
    expect(screen.getByText("detail")).toBeInTheDocument()
  })
})
