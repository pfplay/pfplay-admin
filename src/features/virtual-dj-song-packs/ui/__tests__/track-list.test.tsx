import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { TrackList } from "../track-list"
import type { SongPackTrack } from "@/entities/virtual-dj"

const tracks: SongPackTrack[] = [
  {
    trackId: 11,
    name: "첫 곡",
    linkId: "abc",
    duration: "3:21",
    thumbnailImage: "https://img/1.jpg",
  },
  {
    trackId: 22,
    name: "둘째 곡",
    linkId: "def",
    duration: "4:05",
    thumbnailImage: null,
  },
]

describe("TrackList", () => {
  it("트랙 이름/재생시간 렌더", () => {
    render(<TrackList tracks={tracks} onRemove={vi.fn()} />)
    expect(screen.getByText("첫 곡")).toBeInTheDocument()
    expect(screen.getByText("둘째 곡")).toBeInTheDocument()
    expect(screen.getByText("3:21")).toBeInTheDocument()
    expect(screen.getByText("4:05")).toBeInTheDocument()
  })

  it("thumbnailImage null 이어도 깨지지 않음 (fallback)", () => {
    render(<TrackList tracks={tracks} onRemove={vi.fn()} />)
    // null 썸네일 행도 정상 렌더
    expect(screen.getByText("둘째 곡")).toBeInTheDocument()
  })

  it("제거 버튼 → onRemove(trackId)", () => {
    const onRemove = vi.fn()
    render(<TrackList tracks={tracks} onRemove={onRemove} />)
    fireEvent.click(screen.getByRole("button", { name: "트랙 첫 곡 제거" }))
    expect(onRemove).toHaveBeenCalledWith(11)
  })

  it("빈 목록 → 안내 문구", () => {
    render(<TrackList tracks={[]} onRemove={vi.fn()} />)
    expect(screen.getByText("아직 곡이 없습니다")).toBeInTheDocument()
  })
})
