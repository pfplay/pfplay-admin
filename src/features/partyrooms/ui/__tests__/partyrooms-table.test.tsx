import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { PartyroomsTable } from "../partyrooms-table"
import { partyroomListItemFixture } from "@/test/mocks/fixtures/partyrooms"

const row1 = partyroomListItemFixture
const row2 = { ...partyroomListItemFixture, partyroomId: 2, title: "두 번째 파티룸" }

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
    expect(screen.getByText("활성")).toBeInTheDocument()
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

  describe("selection mode", () => {
    it("selection props 없으면 checkbox column 미렌더 (회귀 0)", () => {
      render(
        <MemoryRouter>
          <PartyroomsTable rows={[row1]} isLoading={false} isEmpty={false} />
        </MemoryRouter>,
      )
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument()
    })

    it("selection props 있으면 row + header checkbox 렌더", () => {
      render(
        <MemoryRouter>
          <PartyroomsTable
            rows={[row1, row2]}
            isLoading={false}
            isEmpty={false}
            selectedIds={new Set()}
            onToggleId={vi.fn()}
            onToggleAll={vi.fn()}
          />
        </MemoryRouter>,
      )
      // header 1 + row 2 = 3
      expect(screen.getAllByRole("checkbox")).toHaveLength(3)
      expect(
        screen.getByRole("checkbox", { name: /전체 선택/ }),
      ).toBeInTheDocument()
    })

    it("row checkbox click → onToggleId(partyroomId) + row navigate 안 함", () => {
      const onToggleId = vi.fn()
      render(
        <MemoryRouter initialEntries={["/partyrooms"]}>
          <Routes>
            <Route
              path="/partyrooms"
              element={
                <PartyroomsTable
                  rows={[row1]}
                  isLoading={false}
                  isEmpty={false}
                  selectedIds={new Set()}
                  onToggleId={onToggleId}
                  onToggleAll={vi.fn()}
                />
              }
            />
            <Route path="/partyrooms/:id" element={<div>detail</div>} />
          </Routes>
        </MemoryRouter>,
      )
      const rowCheckbox = screen.getByRole("checkbox", {
        name: new RegExp(`${row1.title}.*선택`),
      })
      fireEvent.click(rowCheckbox)
      expect(onToggleId).toHaveBeenCalledWith(row1.partyroomId)
      // navigate 미발생 — detail page 미렌더
      expect(screen.queryByText("detail")).not.toBeInTheDocument()
    })

    it("header checkbox click → onToggleAll(true)", () => {
      const onToggleAll = vi.fn()
      render(
        <MemoryRouter>
          <PartyroomsTable
            rows={[row1, row2]}
            isLoading={false}
            isEmpty={false}
            selectedIds={new Set()}
            onToggleId={vi.fn()}
            onToggleAll={onToggleAll}
          />
        </MemoryRouter>,
      )
      fireEvent.click(screen.getByRole("checkbox", { name: /전체 선택/ }))
      expect(onToggleAll).toHaveBeenCalledWith(true)
    })

    it("header checkbox indeterminate when partial selection", () => {
      render(
        <MemoryRouter>
          <PartyroomsTable
            rows={[row1, row2]}
            isLoading={false}
            isEmpty={false}
            selectedIds={new Set([row1.partyroomId])}
            onToggleId={vi.fn()}
            onToggleAll={vi.fn()}
          />
        </MemoryRouter>,
      )
      const header = screen.getByRole("checkbox", { name: /전체 선택/ })
      expect(header).toHaveAttribute("data-state", "indeterminate")
    })

    it("header checkbox checked when all rows selected", () => {
      render(
        <MemoryRouter>
          <PartyroomsTable
            rows={[row1, row2]}
            isLoading={false}
            isEmpty={false}
            selectedIds={new Set([row1.partyroomId, row2.partyroomId])}
            onToggleId={vi.fn()}
            onToggleAll={vi.fn()}
          />
        </MemoryRouter>,
      )
      const header = screen.getByRole("checkbox", { name: /전체 선택/ })
      expect(header).toHaveAttribute("data-state", "checked")
    })

    it("selectedIds 포함 row checkbox는 checked", () => {
      render(
        <MemoryRouter>
          <PartyroomsTable
            rows={[row1, row2]}
            isLoading={false}
            isEmpty={false}
            selectedIds={new Set([row1.partyroomId])}
            onToggleId={vi.fn()}
            onToggleAll={vi.fn()}
          />
        </MemoryRouter>,
      )
      const row1Checkbox = screen.getByRole("checkbox", {
        name: new RegExp(`${row1.title}.*선택`),
      })
      expect(row1Checkbox).toHaveAttribute("data-state", "checked")

      const row2Checkbox = screen.getByRole("checkbox", {
        name: new RegExp(`${row2.title}.*선택`),
      })
      expect(row2Checkbox).toHaveAttribute("data-state", "unchecked")
    })
  })
})
