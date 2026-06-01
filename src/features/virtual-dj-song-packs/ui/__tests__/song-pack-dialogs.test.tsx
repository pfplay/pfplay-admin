import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { CreateSongPackDialog } from "../create-song-pack-dialog"
import { RenameSongPackDialog } from "../rename-song-pack-dialog"
import { DeleteSongPackDialog } from "../delete-song-pack-dialog"

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe("CreateSongPackDialog", () => {
  it("제출 시 POST body {name,description} 전송 + close", async () => {
    let bodySeen: unknown
    server.use(
      http.post(
        "*/api/v1/admin/virtual-dj/song-packs",
        async ({ request }) => {
          bodySeen = await request.json()
          return HttpResponse.json({ data: { id: 1 } }, { status: 201 })
        },
      ),
    )
    const onOpenChange = vi.fn()
    renderWithClient(
      <CreateSongPackDialog open={true} onOpenChange={onOpenChange} />,
    )
    fireEvent.change(screen.getByRole("textbox", { name: "이름" }), {
      target: { value: "새 팩" },
    })
    fireEvent.change(screen.getByRole("textbox", { name: "설명" }), {
      target: { value: "설명입니다" },
    })
    fireEvent.click(screen.getByRole("button", { name: "생성" }))
    await waitFor(() =>
      expect(bodySeen).toEqual({ name: "새 팩", description: "설명입니다" }),
    )
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it("빈 설명은 null 로 정규화", async () => {
    let bodySeen: unknown
    server.use(
      http.post(
        "*/api/v1/admin/virtual-dj/song-packs",
        async ({ request }) => {
          bodySeen = await request.json()
          return HttpResponse.json({ data: { id: 1 } }, { status: 201 })
        },
      ),
    )
    renderWithClient(
      <CreateSongPackDialog open={true} onOpenChange={vi.fn()} />,
    )
    fireEvent.change(screen.getByRole("textbox", { name: "이름" }), {
      target: { value: "팩만" },
    })
    fireEvent.click(screen.getByRole("button", { name: "생성" }))
    await waitFor(() =>
      expect(bodySeen).toEqual({ name: "팩만", description: null }),
    )
  })

  it("이름 비면 검증 에러 → POST 안 함", async () => {
    let called = false
    server.use(
      http.post("*/api/v1/admin/virtual-dj/song-packs", () => {
        called = true
        return HttpResponse.json({ data: { id: 1 } }, { status: 201 })
      }),
    )
    renderWithClient(
      <CreateSongPackDialog open={true} onOpenChange={vi.fn()} />,
    )
    fireEvent.click(screen.getByRole("button", { name: "생성" }))
    expect(await screen.findByText("이름은 필수입니다")).toBeInTheDocument()
    expect(called).toBe(false)
  })
})

describe("RenameSongPackDialog", () => {
  it("제출 시 PUT body {name} 전송 + close", async () => {
    let bodySeen: unknown
    let pathSeen = ""
    server.use(
      http.put(
        "*/api/v1/admin/virtual-dj/song-packs/:id",
        async ({ request, params }) => {
          bodySeen = await request.json()
          pathSeen = String(params.id)
          return new HttpResponse(null, { status: 204 })
        },
      ),
    )
    const onOpenChange = vi.fn()
    renderWithClient(
      <RenameSongPackDialog
        packId={5}
        currentName="기존"
        open={true}
        onOpenChange={onOpenChange}
      />,
    )
    const input = screen.getByRole("textbox", { name: "이름" })
    expect(input).toHaveValue("기존")
    fireEvent.change(input, { target: { value: "변경됨" } })
    fireEvent.click(screen.getByRole("button", { name: "변경" }))
    await waitFor(() => expect(bodySeen).toEqual({ name: "변경됨" }))
    expect(pathSeen).toBe("5")
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })
})

describe("DeleteSongPackDialog", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("삭제 클릭 시 DELETE 호출 + close", async () => {
    let path = ""
    server.use(
      http.delete(
        "*/api/v1/admin/virtual-dj/song-packs/:id",
        ({ params }) => {
          path = String(params.id)
          return new HttpResponse(null, { status: 204 })
        },
      ),
    )
    const onOpenChange = vi.fn()
    renderWithClient(
      <DeleteSongPackDialog
        packId={9}
        packName="삭제대상"
        open={true}
        onOpenChange={onOpenChange}
      />,
    )
    expect(screen.getByText("삭제대상")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "삭제" }))
    await waitFor(() => expect(path).toBe("9"))
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })
})
