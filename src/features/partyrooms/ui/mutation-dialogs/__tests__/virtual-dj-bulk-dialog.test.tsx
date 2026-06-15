import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { toast } from "sonner"
import { VirtualDjBulkDialog } from "../virtual-dj-bulk-dialog"

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

// useSongPacks 가 항상 GET 송팩 목록을 부르므로 기본 핸들러 제공
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

const baseProps = {
  selectedIds: [1, 2, 3],
  open: true,
  onOpenChange: () => {},
  onSuccess: () => {},
}

describe("VirtualDjBulkDialog", () => {
  afterEach(() => vi.restoreAllMocks())

  it("renders title with selection count", () => {
    mockSongPacks()
    renderWithClient(<VirtualDjBulkDialog {...baseProps} />)
    expect(screen.getByText(/가상 DJ 설정.*3건/)).toBeInTheDocument()
  })

  it("OFF (기본) → target/floor 숨김, 송팩 숨김", () => {
    mockSongPacks()
    renderWithClient(<VirtualDjBulkDialog {...baseProps} />)
    expect(screen.queryByLabelText("목표 인원")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("최소 동행 인원")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("송팩 선택")).not.toBeInTheDocument()
  })

  it("OFF (기본) → 즉시 submit 가능 (target/floor 불필요)", () => {
    mockSongPacks()
    renderWithClient(<VirtualDjBulkDialog {...baseProps} />)
    expect(
      screen.getByRole("button", { name: "일괄 적용" }),
    ).not.toBeDisabled()
  })

  it("MANAGED 선택 → target/floor/송팩 표시", () => {
    mockSongPacks()
    renderWithClient(<VirtualDjBulkDialog {...baseProps} />)
    fireEvent.change(screen.getByLabelText("가상 DJ 상태"), {
      target: { value: "MANAGED" },
    })
    expect(screen.getByLabelText("목표 인원")).toBeInTheDocument()
    expect(screen.getByLabelText("최소 동행 인원")).toBeInTheDocument()
    expect(screen.getByLabelText("송팩 선택")).toBeInTheDocument()
  })

  it("MANAGED + target/floor 비어있음 → submit disabled", () => {
    mockSongPacks()
    renderWithClient(<VirtualDjBulkDialog {...baseProps} />)
    fireEvent.change(screen.getByLabelText("가상 DJ 상태"), {
      target: { value: "MANAGED" },
    })
    expect(screen.getByRole("button", { name: "일괄 적용" })).toBeDisabled()
  })

  it("MANAGED + 송팩 미선택 → 경고 노출", () => {
    mockSongPacks()
    renderWithClient(<VirtualDjBulkDialog {...baseProps} />)
    fireEvent.change(screen.getByLabelText("가상 DJ 상태"), {
      target: { value: "MANAGED" },
    })
    expect(
      screen.getByText(/송팩 없으면 봇이 곡을 못 틉니다/),
    ).toBeInTheDocument()
  })

  it("MANAGED + 송팩 선택 → 경고 사라짐", async () => {
    mockSongPacks()
    renderWithClient(<VirtualDjBulkDialog {...baseProps} />)
    fireEvent.change(screen.getByLabelText("가상 DJ 상태"), {
      target: { value: "MANAGED" },
    })
    // 송팩 목록 로드 대기
    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: /여름/ }),
      ).toBeInTheDocument(),
    )
    fireEvent.change(screen.getByLabelText("송팩 선택"), {
      target: { value: "5" },
    })
    expect(
      screen.queryByText(/송팩 없으면 봇이 곡을 못 틉니다/),
    ).not.toBeInTheDocument()
  })

  it("MANAGED 완전 입력 → 올바른 body 전송 (selectedIds 포함)", async () => {
    mockSongPacks()
    let bodySeen: unknown
    server.use(
      http.put("*/api/v1/admin/virtual-dj/bulk", async ({ request }) => {
        bodySeen = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const onSuccess = vi.fn()
    const onOpenChange = vi.fn()
    vi.spyOn(toast, "success").mockImplementation(() => "")

    renderWithClient(
      <VirtualDjBulkDialog
        {...baseProps}
        onSuccess={onSuccess}
        onOpenChange={onOpenChange}
      />,
    )
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

    fireEvent.click(screen.getByRole("button", { name: "일괄 적용" }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
    expect(bodySeen).toEqual({
      partyroomIds: [1, 2, 3],
      status: "MANAGED",
      targetCount: 8,
      companionFloor: 2,
      songPackId: 5,
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("OFF submit → target/floor/songPack null 전송", async () => {
    mockSongPacks()
    let bodySeen: unknown
    server.use(
      http.put("*/api/v1/admin/virtual-dj/bulk", async ({ request }) => {
        bodySeen = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    vi.spyOn(toast, "success").mockImplementation(() => "")
    const onSuccess = vi.fn()

    renderWithClient(
      <VirtualDjBulkDialog {...baseProps} onSuccess={onSuccess} />,
    )
    fireEvent.click(screen.getByRole("button", { name: "일괄 적용" }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
    expect(bodySeen).toEqual({
      partyroomIds: [1, 2, 3],
      status: "OFF",
      targetCount: null,
      companionFloor: null,
      songPackId: null,
    })
  })

  it("does not render when open=false", () => {
    mockSongPacks()
    renderWithClient(<VirtualDjBulkDialog {...baseProps} open={false} />)
    expect(screen.queryByText(/가상 DJ 설정.*3건/)).not.toBeInTheDocument()
  })
})
