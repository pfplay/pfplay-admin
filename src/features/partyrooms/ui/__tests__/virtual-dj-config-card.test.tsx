import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { toast } from "sonner"
import { VirtualDjConfigCard } from "../virtual-dj-config-card"
import type { VirtualDjLiveStatus } from "@/entities/virtual-dj"

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

function mockSongPacks() {
  server.use(
    http.get("*/api/v1/admin/virtual-dj/song-packs", () =>
      HttpResponse.json({
        data: [
          { id: 5, name: "여름", description: null, trackCount: 12 },
          { id: 6, name: "겨울", description: null, trackCount: 3 },
        ],
      }),
    ),
  )
}

function mockLiveStatus(status: Partial<VirtualDjLiveStatus> = {}) {
  const full: VirtualDjLiveStatus = {
    status: "OFF",
    targetCount: null,
    companionFloor: null,
    songPackId: null,
    currentBotDjCount: 0,
    ...status,
  }
  server.use(
    http.get("*/api/v1/admin/partyrooms/7/virtual-dj", () =>
      HttpResponse.json({ data: full }),
    ),
  )
}

describe("VirtualDjConfigCard", () => {
  afterEach(() => vi.restoreAllMocks())

  it("live status 렌더: 봇 {current}/{target} + 상태 배지", async () => {
    mockSongPacks()
    mockLiveStatus({
      status: "MANAGED",
      targetCount: 8,
      currentBotDjCount: 3,
    })
    renderWithClient(<VirtualDjConfigCard partyroomId={7} />)

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
    renderWithClient(<VirtualDjConfigCard partyroomId={7} />)

    expect(await screen.findByText(/봇 0\/—/)).toBeInTheDocument()
  })

  it("status 전환: OFF → target/floor 숨김, MANAGED → 표시", async () => {
    mockSongPacks()
    mockLiveStatus({ status: "OFF" })
    renderWithClient(<VirtualDjConfigCard partyroomId={7} />)

    await screen.findByLabelText("가상 DJ 상태")
    expect(screen.queryByLabelText("목표 인원")).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("가상 DJ 상태"), {
      target: { value: "MANAGED" },
    })
    expect(screen.getByLabelText("목표 인원")).toBeInTheDocument()
    expect(screen.getByLabelText("최소 동행 인원")).toBeInTheDocument()
    expect(screen.getByLabelText("송팩 선택")).toBeInTheDocument()
  })

  it("MANAGED + 송팩 미선택 → 경고 노출 (amber)", async () => {
    mockSongPacks()
    mockLiveStatus({ status: "OFF" })
    renderWithClient(<VirtualDjConfigCard partyroomId={7} />)

    await screen.findByLabelText("가상 DJ 상태")
    fireEvent.change(screen.getByLabelText("가상 DJ 상태"), {
      target: { value: "MANAGED" },
    })
    const warn = screen.getByText(/송팩 없으면 봇이 곡을 못 틉니다/)
    expect(warn).toBeInTheDocument()
    expect(warn.className).toContain("text-amber-600")
  })

  it("적용 → 올바른 body PUT 전송", async () => {
    mockSongPacks()
    mockLiveStatus({ status: "OFF" })
    let bodySeen: unknown
    server.use(
      http.put("*/api/v1/admin/partyrooms/7/virtual-dj", async ({ request }) => {
        bodySeen = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    vi.spyOn(toast, "success").mockImplementation(() => "")

    renderWithClient(<VirtualDjConfigCard partyroomId={7} />)
    await screen.findByLabelText("가상 DJ 상태")

    fireEvent.change(screen.getByLabelText("가상 DJ 상태"), {
      target: { value: "MANAGED" },
    })
    fireEvent.change(screen.getByLabelText("목표 인원"), {
      target: { value: "8" },
    })
    fireEvent.change(screen.getByLabelText("최소 동행 인원"), {
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
        companionFloor: 2,
        songPackId: 5,
      }),
    )
  })

  it("봇 비우기 → confirm 후 POST drain", async () => {
    mockSongPacks()
    mockLiveStatus({ status: "MANAGED", targetCount: 8, currentBotDjCount: 3 })
    let drainCalled = false
    server.use(
      http.post("*/api/v1/admin/partyrooms/7/virtual-dj/drain", () => {
        drainCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    vi.spyOn(toast, "success").mockImplementation(() => "")

    renderWithClient(<VirtualDjConfigCard partyroomId={7} />)
    await screen.findByText(/봇 3\/8/)

    // 카드의 트리거 버튼
    fireEvent.click(screen.getByRole("button", { name: "봇 비우기" }))
    // confirm dialog 의 실행 버튼 (dialog 안에서 scope)
    const dialog = await screen.findByRole("dialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "봇 비우기" }))

    await waitFor(() => expect(drainCalled).toBe(true))
  })

  it("동결 → POST freeze (직접)", async () => {
    mockSongPacks()
    mockLiveStatus({ status: "MANAGED", targetCount: 8, currentBotDjCount: 3 })
    let freezeCalled = false
    server.use(
      http.post("*/api/v1/admin/partyrooms/7/virtual-dj/freeze", () => {
        freezeCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    vi.spyOn(toast, "success").mockImplementation(() => "")

    renderWithClient(<VirtualDjConfigCard partyroomId={7} />)
    await screen.findByText(/봇 3\/8/)

    fireEvent.click(screen.getByRole("button", { name: "동결" }))

    await waitFor(() => expect(freezeCalled).toBe(true))
  })

  it("로드 실패 → 에러 메시지", async () => {
    mockSongPacks()
    server.use(
      http.get("*/api/v1/admin/partyrooms/7/virtual-dj", () =>
        HttpResponse.json(
          { status: 500, errorCode: "ERR", message: "boom" },
          { status: 500 },
        ),
      ),
    )
    renderWithClient(<VirtualDjConfigCard partyroomId={7} />)

    expect(
      await screen.findByText(/가상 DJ 상태를 불러오지 못했습니다/),
    ).toBeInTheDocument()
  })
})
