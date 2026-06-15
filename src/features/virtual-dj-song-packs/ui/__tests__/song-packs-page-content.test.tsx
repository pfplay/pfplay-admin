import { describe, it, expect } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { SongPacksPageContent } from "../song-packs-page-content"

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <SongPacksPageContent />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const listFixture = [
  { id: 1, name: "여름 팩", description: "여름", trackCount: 5 },
  { id: 2, name: "겨울 팩", description: null, trackCount: 0 },
]

describe("SongPacksPageContent", () => {
  it("목록 로드 후 송팩 이름 렌더", async () => {
    server.use(
      http.get("*/api/v1/admin/virtual-dj/song-packs", () =>
        HttpResponse.json({ data: listFixture }),
      ),
    )
    renderPage()
    await waitFor(() => expect(screen.getByText("여름 팩")).toBeInTheDocument())
    expect(screen.getByText("겨울 팩")).toBeInTheDocument()
  })

  it("로드 에러 시 에러 안내", async () => {
    server.use(
      http.get("*/api/v1/admin/virtual-dj/song-packs", () =>
        HttpResponse.json(
          { status: 500, errorCode: "X", message: "boom" },
          { status: 500 },
        ),
      ),
    )
    renderPage()
    await waitFor(() =>
      expect(screen.getByText(/불러오지 못했습니다/)).toBeInTheDocument(),
    )
  })

  it("송팩 생성 버튼 → 다이얼로그 열림 → POST 트리거", async () => {
    let posted = false
    server.use(
      http.get("*/api/v1/admin/virtual-dj/song-packs", () =>
        HttpResponse.json({ data: listFixture }),
      ),
      http.post("*/api/v1/admin/virtual-dj/song-packs", () => {
        posted = true
        return HttpResponse.json({ data: { id: 99 } }, { status: 201 })
      }),
    )
    renderPage()
    await waitFor(() => expect(screen.getByText("여름 팩")).toBeInTheDocument())
    fireEvent.click(screen.getByRole("button", { name: /송팩 생성/ }))
    // 다이얼로그 열림 — 생성 폼의 이름 입력이 나타남
    await screen.findByRole("textbox", { name: "이름" })
    fireEvent.change(screen.getByRole("textbox", { name: "이름" }), {
      target: { value: "신규 팩" },
    })
    fireEvent.click(screen.getByRole("button", { name: "생성" }))
    await waitFor(() => expect(posted).toBe(true))
  })

  it("이름 변경 버튼 → rename 다이얼로그 → PUT 트리거", async () => {
    let put = false
    server.use(
      http.get("*/api/v1/admin/virtual-dj/song-packs", () =>
        HttpResponse.json({ data: listFixture }),
      ),
      http.put("*/api/v1/admin/virtual-dj/song-packs/1", () => {
        put = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderPage()
    await waitFor(() => expect(screen.getByText("여름 팩")).toBeInTheDocument())
    fireEvent.click(screen.getByRole("button", { name: "송팩 #1 이름 변경" }))
    const input = await screen.findByRole("textbox", { name: "이름" })
    fireEvent.change(input, { target: { value: "여름 팩 v2" } })
    fireEvent.click(screen.getByRole("button", { name: "변경" }))
    await waitFor(() => expect(put).toBe(true))
  })

  it("삭제 버튼 → delete 다이얼로그 → DELETE 트리거", async () => {
    let deleted = false
    server.use(
      http.get("*/api/v1/admin/virtual-dj/song-packs", () =>
        HttpResponse.json({ data: listFixture }),
      ),
      http.delete("*/api/v1/admin/virtual-dj/song-packs/2", () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderPage()
    await waitFor(() => expect(screen.getByText("겨울 팩")).toBeInTheDocument())
    fireEvent.click(screen.getByRole("button", { name: "송팩 #2 삭제" }))
    fireEvent.click(await screen.findByRole("button", { name: "삭제" }))
    await waitFor(() => expect(deleted).toBe(true))
  })
})
