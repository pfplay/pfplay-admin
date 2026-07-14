import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { toast } from "sonner"
import { VirtualCrewConfigCard } from "../virtual-crew-config-card"
import type { VirtualCrewLiveStatus } from "@/entities/virtual-crew"

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

function mockSongPacks() {
  server.use(
    http.get("*/api/v1/admin/virtual-crew/song-packs", () =>
      HttpResponse.json({
        data: [
          { id: 5, name: "여름", description: null, trackCount: 12 },
          { id: 6, name: "겨울", description: null, trackCount: 3 },
        ],
      }),
    ),
  )
}

function mockLiveStatus(status: Partial<VirtualCrewLiveStatus> = {}) {
  const full: VirtualCrewLiveStatus = {
    status: "OFF",
    targetCount: null,
    djBotCount: null,
    songPackId: null,
    currentBotDjCount: 0,
    ...status,
  }
  server.use(
    http.get("*/api/v1/admin/partyrooms/7/virtual-crew", () =>
      HttpResponse.json({ data: full }),
    ),
  )
}

describe("VirtualCrewConfigCard", () => {
  afterEach(() => vi.restoreAllMocks())

  it("live status 렌더: 봇 {current}/{target} + 상태 배지", async () => {
    mockSongPacks()
    mockLiveStatus({
      status: "MANAGED",
      targetCount: 8,
      currentBotDjCount: 3,
    })
    renderWithClient(<VirtualCrewConfigCard partyroomId={7} />)

    expect(await screen.findByText(/봇 3\/8/)).toBeInTheDocument()
    // 헤더 상태 배지 "운영중" (select option 과 구분 — badge data-slot)
    const badge = screen
      .getAllByText("운영중")
      .find((el) => el.getAttribute("data-slot") === "badge")
    expect(badge).toBeDefined()
  })

  it("targetCount null → '봇 0/—'", async () => {
    mockSongPacks()
    mockLiveStatus({ status: "OFF", targetCount: null, currentBotDjCount: 0 })
    renderWithClient(<VirtualCrewConfigCard partyroomId={7} />)

    expect(await screen.findByText(/봇 0\/—/)).toBeInTheDocument()
  })

  it("status 전환: OFF → target/floor 숨김, MANAGED → 표시", async () => {
    mockSongPacks()
    mockLiveStatus({ status: "OFF" })
    renderWithClient(<VirtualCrewConfigCard partyroomId={7} />)

    await screen.findByLabelText("가상 크루 상태")
    expect(screen.queryByLabelText("목표 인원")).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("가상 크루 상태"), {
      target: { value: "MANAGED" },
    })
    expect(screen.getByLabelText("목표 인원")).toBeInTheDocument()
    expect(screen.getByLabelText("DJ 봇 수")).toBeInTheDocument()
    expect(screen.getByLabelText("송팩 선택")).toBeInTheDocument()
  })

  it("MANAGED + 송팩 미선택 → 경고 노출 (amber)", async () => {
    mockSongPacks()
    mockLiveStatus({ status: "OFF" })
    renderWithClient(<VirtualCrewConfigCard partyroomId={7} />)

    await screen.findByLabelText("가상 크루 상태")
    fireEvent.change(screen.getByLabelText("가상 크루 상태"), {
      target: { value: "MANAGED" },
    })
    const warn = screen.getByText(/송팩을 선택해야/)
    expect(warn).toBeInTheDocument()
    expect(warn.className).toContain("text-amber-600")
  })

  it("적용 → 올바른 body PUT 전송", async () => {
    mockSongPacks()
    mockLiveStatus({ status: "OFF" })
    let bodySeen: unknown
    server.use(
      http.put("*/api/v1/admin/partyrooms/7/virtual-crew", async ({ request }) => {
        bodySeen = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    vi.spyOn(toast, "success").mockImplementation(() => "")

    renderWithClient(<VirtualCrewConfigCard partyroomId={7} />)
    await screen.findByLabelText("가상 크루 상태")

    fireEvent.change(screen.getByLabelText("가상 크루 상태"), {
      target: { value: "MANAGED" },
    })
    fireEvent.change(screen.getByLabelText("목표 인원"), {
      target: { value: "8" },
    })
    fireEvent.change(screen.getByLabelText("DJ 봇 수"), {
      target: { value: "2" },
    })
    await waitFor(() =>
      expect(screen.getByRole("option", { name: /여름/ })).toBeInTheDocument(),
    )
    fireEvent.change(screen.getByLabelText("송팩 선택"), {
      target: { value: "5" },
    })

    fireEvent.click(screen.getByRole("button", { name: "적용" }))

    await waitFor(() =>
      expect(bodySeen).toEqual({
        status: "MANAGED",
        targetCount: 8,
        djBotCount: 2,
        songPackId: 5,
      }),
    )
  })

  it("봇 비우기 → confirm 후 POST drain", async () => {
    mockSongPacks()
    mockLiveStatus({ status: "MANAGED", targetCount: 8, currentBotDjCount: 3 })
    let drainCalled = false
    server.use(
      http.post("*/api/v1/admin/partyrooms/7/virtual-crew/drain", () => {
        drainCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    vi.spyOn(toast, "success").mockImplementation(() => "")

    renderWithClient(<VirtualCrewConfigCard partyroomId={7} />)
    await screen.findByText(/봇 3\/8/)

    // 카드의 트리거 버튼
    fireEvent.click(screen.getByRole("button", { name: "봇 비우기" }))
    // confirm dialog 의 실행 버튼 (dialog 안에서 scope)
    const dialog = await screen.findByRole("dialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "봇 비우기" }))

    await waitFor(() => expect(drainCalled).toBe(true))
  })

  it("리소스 회수 → POST drain-resources (직접, MANAGED 시 활성)", async () => {
    mockSongPacks()
    mockLiveStatus({ status: "MANAGED", targetCount: 8, currentBotDjCount: 3 })
    let called = false
    server.use(
      http.post("*/api/v1/admin/partyrooms/7/virtual-crew/drain-resources", () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    vi.spyOn(toast, "success").mockImplementation(() => "")

    renderWithClient(<VirtualCrewConfigCard partyroomId={7} />)
    await screen.findByText(/봇 3\/8/)

    fireEvent.click(screen.getByRole("button", { name: "리소스 회수" }))

    await waitFor(() => expect(called).toBe(true))
  })

  it("부활 → POST revive (직접, MANAGED 시 활성)", async () => {
    mockSongPacks()
    mockLiveStatus({ status: "MANAGED", targetCount: 8, currentBotDjCount: 3 })
    let called = false
    server.use(
      http.post("*/api/v1/admin/partyrooms/7/virtual-crew/revive", () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    vi.spyOn(toast, "success").mockImplementation(() => "")

    renderWithClient(<VirtualCrewConfigCard partyroomId={7} />)
    await screen.findByText(/봇 3\/8/)

    fireEvent.click(screen.getByRole("button", { name: "부활" }))

    await waitFor(() => expect(called).toBe(true))
  })

  it("OFF 상태 → 부활/리소스 회수/재배치 버튼 비활성", async () => {
    mockSongPacks()
    mockLiveStatus({ status: "OFF" })

    renderWithClient(<VirtualCrewConfigCard partyroomId={7} />)
    await screen.findByLabelText("가상 크루 상태")

    expect(screen.getByRole("button", { name: "부활" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "리소스 회수" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "재배치" })).toBeDisabled()
  })

  it("MANAGED 상태 → 재배치 버튼 활성", async () => {
    mockSongPacks()
    mockLiveStatus({ status: "MANAGED", targetCount: 8, currentBotDjCount: 3 })

    renderWithClient(<VirtualCrewConfigCard partyroomId={7} />)
    await screen.findByText(/봇 3\/8/)

    expect(screen.getByRole("button", { name: "재배치" })).toBeEnabled()
  })

  it("재배치 → confirm 후 POST replace, 다이얼로그 닫힘", async () => {
    mockSongPacks()
    mockLiveStatus({ status: "MANAGED", targetCount: 8, currentBotDjCount: 3 })
    let replaceCalled = false
    server.use(
      http.post("*/api/v1/admin/partyrooms/7/virtual-crew/replace", () => {
        replaceCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    vi.spyOn(toast, "success").mockImplementation(() => "")

    renderWithClient(<VirtualCrewConfigCard partyroomId={7} />)
    await screen.findByText(/봇 3\/8/)

    // 카드의 트리거 버튼
    fireEvent.click(screen.getByRole("button", { name: "재배치" }))
    // 확인 다이얼로그 (트리거와 동일한 이름의 확인 버튼이 존재 — within(dialog)로 스코프)
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("봇 재배치")).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole("button", { name: "재배치" }))

    await waitFor(() => expect(replaceCalled).toBe(true))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("재배치 다이얼로그 취소 → POST replace 호출 안 함", async () => {
    mockSongPacks()
    mockLiveStatus({ status: "MANAGED", targetCount: 8, currentBotDjCount: 3 })
    let replaceCalled = false
    server.use(
      http.post("*/api/v1/admin/partyrooms/7/virtual-crew/replace", () => {
        replaceCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderWithClient(<VirtualCrewConfigCard partyroomId={7} />)
    await screen.findByText(/봇 3\/8/)

    fireEvent.click(screen.getByRole("button", { name: "재배치" }))
    const dialog = await screen.findByRole("dialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "취소" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(replaceCalled).toBe(false)
  })

  it("로드 실패 → 에러 메시지", async () => {
    mockSongPacks()
    server.use(
      http.get("*/api/v1/admin/partyrooms/7/virtual-crew", () =>
        HttpResponse.json(
          { status: 500, errorCode: "ERR", message: "boom" },
          { status: 500 },
        ),
      ),
    )
    renderWithClient(<VirtualCrewConfigCard partyroomId={7} />)

    expect(
      await screen.findByText(/가상 크루 상태를 불러오지 못했습니다/),
    ).toBeInTheDocument()
  })
})
