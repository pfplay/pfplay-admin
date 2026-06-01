import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { server } from "@/test/mocks/server"
import { http, HttpResponse } from "msw"
import { MusicSearch } from "../music-search"
import type { MusicSearchResult } from "../../model/music-search-result"

const RESULTS: MusicSearchResult[] = [
  {
    videoId: "dQw4w9WgXcQ",
    videoTitle: "Never Gonna Give You Up",
    runningTime: "3:33",
    thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg",
  },
  {
    videoId: "abc123",
    videoTitle: "Another Song",
    runningTime: "4:0",
    thumbnailUrl: "https://i.ytimg.com/vi/abc123/default.jpg",
  },
]

function mockSearch(list: MusicSearchResult[] = RESULTS) {
  server.use(
    http.get("*/api/v1/admin/virtual-dj/music-search", () =>
      HttpResponse.json({ data: { musicList: list } }),
    ),
  )
}

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>
}

describe("MusicSearch", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("검색어 입력 → (디바운스 후) 결과 목록 렌더", async () => {
    mockSearch()
    const u = userEvent.setup()
    render(wrap(<MusicSearch onSelect={vi.fn()} />))

    await u.type(screen.getByTestId("music-search-input"), "rick")

    await waitFor(
      () => {
        expect(screen.getByText("Never Gonna Give You Up")).toBeInTheDocument()
        expect(screen.getByText("Another Song")).toBeInTheDocument()
      },
      { timeout: 2000 },
    )
    // duration zero-pad 정규화 확인 (4:0 → 04:00)
    expect(screen.getByText("04:00")).toBeInTheDocument()
  })

  it("결과 클릭 → onSelect 가 해당 result 로 호출", async () => {
    mockSearch()
    const onSelect = vi.fn()
    const u = userEvent.setup()
    render(wrap(<MusicSearch onSelect={onSelect} />))

    await u.type(screen.getByTestId("music-search-input"), "rick")
    await waitFor(
      () => expect(screen.getByText("Never Gonna Give You Up")).toBeInTheDocument(),
      { timeout: 2000 },
    )

    const buttons = screen.getAllByTestId("track-select-button")
    await u.click(buttons[0])

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(RESULTS[0])
  })

  it("결과 없음 → 빈 상태 메시지", async () => {
    mockSearch([])
    const u = userEvent.setup()
    render(wrap(<MusicSearch onSelect={vi.fn()} />))

    await u.type(screen.getByTestId("music-search-input"), "zzzz")
    await waitFor(
      () => expect(screen.getByText("검색 결과가 없습니다.")).toBeInTheDocument(),
      { timeout: 2000 },
    )
  })
})
