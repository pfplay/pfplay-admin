import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { SongPacksList } from "../song-packs-list"
import type { SongPackListItem } from "@/entities/virtual-dj"

const rows: SongPackListItem[] = [
  { id: 1, name: "여름 팩", description: "여름 시즌", trackCount: 12 },
  { id: 2, name: "겨울 팩", description: null, trackCount: 0 },
]

describe("SongPacksList", () => {
  it("loading — 스켈레톤 표시", () => {
    const { container } = render(
      <MemoryRouter>
        <SongPacksList
          rows={[]}
          isLoading={true}
          isEmpty={false}
          onRenameClick={vi.fn()}
          onDeleteClick={vi.fn()}
        />
      </MemoryRouter>,
    )
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    )
  })

  it("empty — 안내 문구", () => {
    render(
      <MemoryRouter>
        <SongPacksList
          rows={[]}
          isLoading={false}
          isEmpty={true}
          onRenameClick={vi.fn()}
          onDeleteClick={vi.fn()}
        />
      </MemoryRouter>,
    )
    expect(screen.getByText("등록된 송팩이 없습니다")).toBeInTheDocument()
  })

  it("loaded — 이름/트랙수/설명 렌더", () => {
    render(
      <MemoryRouter>
        <SongPacksList
          rows={rows}
          isLoading={false}
          isEmpty={false}
          onRenameClick={vi.fn()}
          onDeleteClick={vi.fn()}
        />
      </MemoryRouter>,
    )
    expect(screen.getByText("여름 팩")).toBeInTheDocument()
    expect(screen.getByText("여름 시즌")).toBeInTheDocument()
    expect(screen.getByText("12")).toBeInTheDocument()
    // description null → 대시
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("row click → /virtual-dj/song-packs/:id 라우팅", () => {
    render(
      <MemoryRouter initialEntries={["/virtual-dj/song-packs"]}>
        <Routes>
          <Route
            path="/virtual-dj/song-packs"
            element={
              <SongPacksList
                rows={rows}
                isLoading={false}
                isEmpty={false}
                onRenameClick={vi.fn()}
                onDeleteClick={vi.fn()}
              />
            }
          />
          <Route
            path="/virtual-dj/song-packs/:id"
            element={<div>detail</div>}
          />
        </Routes>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText("여름 팩"))
    expect(screen.getByText("detail")).toBeInTheDocument()
  })

  it("이름 변경 / 삭제 버튼 클릭은 row navigate 없이 콜백 호출", () => {
    const onRenameClick = vi.fn()
    const onDeleteClick = vi.fn()
    render(
      <MemoryRouter initialEntries={["/virtual-dj/song-packs"]}>
        <Routes>
          <Route
            path="/virtual-dj/song-packs"
            element={
              <SongPacksList
                rows={rows}
                isLoading={false}
                isEmpty={false}
                onRenameClick={onRenameClick}
                onDeleteClick={onDeleteClick}
              />
            }
          />
          <Route
            path="/virtual-dj/song-packs/:id"
            element={<div>detail</div>}
          />
        </Routes>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole("button", { name: "송팩 #1 이름 변경" }))
    expect(onRenameClick).toHaveBeenCalledWith(rows[0])
    fireEvent.click(screen.getByRole("button", { name: "송팩 #1 삭제" }))
    expect(onDeleteClick).toHaveBeenCalledWith(rows[0])
    // navigate 안 됨 (detail 미렌더)
    expect(screen.queryByText("detail")).toBeNull()
  })
})
