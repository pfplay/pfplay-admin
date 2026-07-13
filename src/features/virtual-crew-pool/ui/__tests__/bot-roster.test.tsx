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
    http.get("*/api/v1/admin/virtual-crew/bots", () =>
      HttpResponse.json({ data: items }),
    ),
    http.get("*/api/v1/admin/virtual-crew/avatar-catalog", () =>
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
  it("행마다 닉네임·채팅 아이콘·바디 썸네일·배치룸·변경 버튼 렌더", async () => {
    mockRoster()
    renderRoster()
    await waitFor(() => expect(screen.getByText("봇하나")).toBeInTheDocument())
    expect(screen.getByText("봇둘")).toBeInTheDocument()

    // 채팅 아이콘(P1 보장 대상)이 노출되어야 함
    expect(screen.getByAltText("봇하나 아이콘")).toHaveAttribute("src", "icon1")
    // 바디 썸네일도 함께 노출 (인룸 실루엣 다양성)
    expect(screen.getByAltText("봇하나 바디")).toHaveAttribute("src", "body1")

    // 배치룸 링크 (placed) vs idle 표시
    const placedLink = screen.getByRole("link", { name: /메인룸/ })
    expect(placedLink).toHaveAttribute("href", "/partyrooms/10")

    // 개별 변경 버튼 행마다
    expect(
      screen.getAllByRole("button", { name: "아바타 변경" }),
    ).toHaveLength(2)
  })

  it("배치된 봇은 미배치 봇과 색상(data-placed)으로 구분된다", async () => {
    mockRoster()
    renderRoster()
    await waitFor(() => expect(screen.getByText("봇하나")).toBeInTheDocument())

    const placedLi = screen.getByText("봇하나").closest("li")
    const idleLi = screen.getByText("봇둘").closest("li")
    expect(placedLi).toHaveAttribute("data-placed", "true")
    expect(idleLi).toHaveAttribute("data-placed", "false")
    // 배치 봇 행에만 강조 색상(에메랄드) 적용
    expect(placedLi?.className).toContain("emerald")
    expect(idleLi?.className).not.toContain("emerald")
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

  it("배분 성공 후 선택 해제(툴바 사라짐)", async () => {
    mockRoster()
    server.use(
      http.post(
        "*/api/v1/admin/virtual-crew/bots/avatar/distribute",
        () =>
          HttpResponse.json({
            data: { assigned: [{ userId: 1, avatarBodyUri: "u1" }] },
          }),
      ),
    )
    renderRoster()
    await waitFor(() => expect(screen.getByText("봇하나")).toBeInTheDocument())

    await userEvent.click(
      screen.getByRole("checkbox", { name: /봇하나 선택/ }),
    )
    expect(screen.getByText(/선택: 1명/)).toBeInTheDocument()

    await userEvent.click(
      screen.getByRole("button", { name: "아바타 일괄 변경" }),
    )
    const dialog = await screen.findByRole("dialog")
    await within(dialog).findByText("바디 1")
    await userEvent.click(
      within(dialog).getByRole("button", { name: /바디 1/ }),
    )
    await userEvent.click(within(dialog).getByRole("button", { name: /배분/ }))

    // 결과 요약은 다이얼로그에 남되, 부모 선택은 해제되어 툴바가 사라짐
    await waitFor(() =>
      expect(screen.queryByText(/선택: 1명/)).not.toBeInTheDocument(),
    )
  })

  it("idle 봇 선택 → 선택 제거 → 확인 다이얼로그 → 제거 성공 시 선택 해제", async () => {
    mockRoster()
    let removeCalled = false
    server.use(
      http.post("*/api/v1/admin/virtual-crew/bots/remove", () => {
        removeCalled = true
        return HttpResponse.json({ data: { removed: 1, removedUserIds: [2] } })
      }),
    )
    renderRoster()
    await waitFor(() => expect(screen.getByText("봇둘")).toBeInTheDocument())

    // idle 봇(봇둘) 선택
    await userEvent.click(screen.getByRole("checkbox", { name: /봇둘 선택/ }))
    await userEvent.click(screen.getByRole("button", { name: "선택 제거" }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText(/봇 1명 제거/)).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole("button", { name: "제거" }))

    await waitFor(() => expect(removeCalled).toBe(true))
    // 성공 후 선택 해제 → 툴바 사라짐
    await waitFor(() =>
      expect(screen.queryByText(/선택: 1명/)).not.toBeInTheDocument(),
    )
  })

  it("배치된 봇 선택 시 제거 버튼 비활성 + 경고 노출", async () => {
    mockRoster()
    renderRoster()
    await waitFor(() => expect(screen.getByText("봇하나")).toBeInTheDocument())

    // 배치된 봇(봇하나) 선택
    await userEvent.click(screen.getByRole("checkbox", { name: /봇하나 선택/ }))
    await userEvent.click(screen.getByRole("button", { name: "선택 제거" }))

    const dialog = await screen.findByRole("dialog")
    expect(
      within(dialog).getByText(/먼저 해당 방을/),
    ).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "제거" })).toBeDisabled()
  })

  it("로드 에러 시 안내", async () => {
    server.use(
      http.get("*/api/v1/admin/virtual-crew/bots", () =>
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
