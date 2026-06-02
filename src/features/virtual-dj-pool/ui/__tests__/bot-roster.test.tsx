import { describe, it, expect } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { BotRoster } from "../bot-roster"

const ROSTER = [
  {
    userId: 1,
    nickname: "봇하나",
    avatarBodyUri: "body1",
    avatarIconUri: "icon1",
    placementRoomId: 10,
    placementRoomTitle: "메인룸",
  },
  {
    userId: 2,
    nickname: "봇둘",
    avatarBodyUri: "body2",
    avatarIconUri: "icon2",
    placementRoomId: null,
    placementRoomTitle: null,
  },
]

const CATALOG = [
  {
    bodyUri: "u1",
    name: "바디 1",
    thumbnailUri: "t1",
    combinable: true,
    obtainableType: "BASIC",
  },
]

function mockRoster(items = ROSTER) {
  server.use(
    http.get("*/api/v1/admin/virtual-dj/bots", () =>
      HttpResponse.json({ data: items }),
    ),
    http.get("*/api/v1/admin/virtual-dj/avatar-catalog", () =>
      HttpResponse.json({ data: CATALOG }),
    ),
  )
}

function renderRoster() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <BotRoster />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("BotRoster", () => {
  it("행마다 닉네임·바디 썸네일·배치룸·변경 버튼 렌더", async () => {
    mockRoster()
    renderRoster()
    await waitFor(() => expect(screen.getByText("봇하나")).toBeInTheDocument())
    expect(screen.getByText("봇둘")).toBeInTheDocument()

    // 바디 썸네일
    expect(screen.getByAltText("봇하나")).toHaveAttribute("src", "body1")

    // 배치룸 링크 (placed) vs idle 표시
    const placedLink = screen.getByRole("link", { name: "메인룸" })
    expect(placedLink).toHaveAttribute("href", "/partyrooms/10")

    // 개별 변경 버튼 행마다
    expect(
      screen.getAllByRole("button", { name: "아바타 변경" }),
    ).toHaveLength(2)
  })

  it("선택 없으면 일괄 툴바 숨김, 1개 이상 선택 시 노출", async () => {
    mockRoster()
    renderRoster()
    await waitFor(() => expect(screen.getByText("봇하나")).toBeInTheDocument())

    expect(
      screen.queryByRole("button", { name: "아바타 일괄 변경" }),
    ).not.toBeInTheDocument()

    await userEvent.click(
      screen.getByRole("checkbox", { name: /봇하나 선택/ }),
    )
    expect(
      screen.getByRole("button", { name: "아바타 일괄 변경" }),
    ).toBeInTheDocument()
    expect(screen.getByText(/선택: 1명/)).toBeInTheDocument()
  })

  it("개별 변경 버튼 → set 다이얼로그 오픈", async () => {
    mockRoster()
    renderRoster()
    await waitFor(() => expect(screen.getByText("봇하나")).toBeInTheDocument())

    await userEvent.click(
      screen.getAllByRole("button", { name: "아바타 변경" })[0],
    )
    const dialog = await screen.findByRole("dialog")
    expect(
      within(dialog).getByText(/아바타 변경 — 봇하나/),
    ).toBeInTheDocument()
  })

  it("일괄 변경 버튼 → distribute 다이얼로그 오픈", async () => {
    mockRoster()
    renderRoster()
    await waitFor(() => expect(screen.getByText("봇하나")).toBeInTheDocument())

    await userEvent.click(
      screen.getByRole("checkbox", { name: /봇하나 선택/ }),
    )
    await userEvent.click(
      screen.getByRole("button", { name: "아바타 일괄 변경" }),
    )
    const dialog = await screen.findByRole("dialog")
    expect(
      within(dialog).getByText(/아바타 일괄 변경 \(1명\)/),
    ).toBeInTheDocument()
  })

  it("로드 에러 시 안내", async () => {
    server.use(
      http.get("*/api/v1/admin/virtual-dj/bots", () =>
        HttpResponse.json(
          { status: 500, errorCode: "X", message: "boom" },
          { status: 500 },
        ),
      ),
    )
    renderRoster()
    await waitFor(() =>
      expect(screen.getByText(/불러오지 못했습니다/)).toBeInTheDocument(),
    )
  })
})
