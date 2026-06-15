import { describe, it, expect, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { SongPackBuilder } from "../song-pack-builder"
import type { SongPackDetail } from "@/entities/virtual-dj"
import type { MusicSearchResult } from "@/features/music-search"

const DETAIL: SongPackDetail = {
  id: 7,
  name: "여름 팩",
  description: "여름 시즌용",
  tracks: [
    {
      trackId: 100,
      name: "기존 곡",
      linkId: "existing",
      duration: "2:30",
      thumbnailImage: "https://img/existing.jpg",
    },
  ],
}

const SEARCH_RESULT: MusicSearchResult = {
  videoId: "vid123",
  videoTitle: "검색된 곡",
  runningTime: "3:45",
  thumbnailUrl: "https://img/search.jpg",
}

function mockDetail(detail: SongPackDetail) {
  server.use(
    http.get("*/api/v1/admin/virtual-dj/song-packs/:id", () =>
      HttpResponse.json({ data: detail }),
    ),
  )
}

function mockSearch(results: MusicSearchResult[]) {
  server.use(
    http.get("*/api/v1/admin/virtual-dj/music-search", () =>
      HttpResponse.json({ data: { musicList: results } }),
    ),
  )
}

function renderBuilder(packId = 7) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <SongPackBuilder packId={packId} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("SongPackBuilder", () => {
  beforeEach(() => {
    mockSearch([])
  })

  it("팩 이름 + 기존 트랙 렌더", async () => {
    mockDetail(DETAIL)
    renderBuilder()
    expect(await screen.findByText("여름 팩")).toBeInTheDocument()
    expect(screen.getByText("여름 시즌용")).toBeInTheDocument()
    expect(screen.getByText("기존 곡")).toBeInTheDocument()
  })

  it("music-search 결과 선택 → addTrack 에 toPackTrack 매핑된 바디 전송", async () => {
    mockDetail(DETAIL)
    mockSearch([SEARCH_RESULT])

    let bodySeen: unknown
    let pathSeen = ""
    server.use(
      http.post(
        "*/api/v1/admin/virtual-dj/song-packs/:id/tracks",
        async ({ request, params }) => {
          bodySeen = await request.json()
          pathSeen = String(params.id)
          return HttpResponse.json({ data: { id: 999 } }, { status: 201 })
        },
      ),
    )

    renderBuilder(7)
    await screen.findByText("여름 팩")

    // 검색어 입력 → 결과 렌더 대기
    fireEvent.change(screen.getByTestId("music-search-input"), {
      target: { value: "검색" },
    })
    const addBtn = await screen.findByTestId("track-select-button", undefined, {
      timeout: 2000,
    })
    fireEvent.click(addBtn)

    await waitFor(() =>
      expect(bodySeen).toEqual({
        name: "검색된 곡",
        linkId: "vid123",
        duration: "3:45",
        thumbnailImage: "https://img/search.jpg",
      }),
    )
    // raw videoTitle/videoId 가 새지 않았는지
    expect(bodySeen).not.toHaveProperty("videoTitle")
    expect(bodySeen).not.toHaveProperty("videoId")
    expect(pathSeen).toBe("7")
  })

  it("트랙 제거 버튼 → DELETE trackId 호출", async () => {
    mockDetail(DETAIL)
    let pathSeen = ""
    server.use(
      http.delete(
        "*/api/v1/admin/virtual-dj/song-packs/:id/tracks/:trackId",
        ({ params }) => {
          pathSeen = `${params.id}/${params.trackId}`
          return new HttpResponse(null, { status: 204 })
        },
      ),
    )
    renderBuilder(7)
    await screen.findByText("기존 곡")
    fireEvent.click(screen.getByRole("button", { name: "트랙 기존 곡 제거" }))
    await waitFor(() => expect(pathSeen).toBe("7/100"))
  })

  it("트랙 없는 팩 → 빈 상태 문구", async () => {
    mockDetail({ ...DETAIL, tracks: [] })
    renderBuilder()
    expect(await screen.findByText("아직 곡이 없습니다")).toBeInTheDocument()
  })

  it("404 → 친절한 안내", async () => {
    server.use(
      http.get("*/api/v1/admin/virtual-dj/song-packs/:id", () =>
        HttpResponse.json(
          { errorCode: "NOT_FOUND", message: "없음" },
          { status: 404 },
        ),
      ),
    )
    renderBuilder()
    expect(
      await screen.findByText("존재하지 않는 송팩입니다"),
    ).toBeInTheDocument()
  })
})
