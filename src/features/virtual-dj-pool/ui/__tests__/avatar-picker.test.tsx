import { describe, it, expect, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { AvatarPicker } from "../avatar-picker"

const CATALOG = [
  {
    bodyUri: "u1",
    name: "바디 1",
    thumbnailUri: "t1",
    combinable: true,
    obtainableType: "BASIC",
  },
  {
    bodyUri: "u2",
    name: "바디 2",
    thumbnailUri: "t2",
    combinable: false,
    obtainableType: null,
  },
  {
    bodyUri: "u3",
    name: "바디 3",
    thumbnailUri: "t3",
    combinable: true,
    obtainableType: "DJ_PNT",
  },
]

function mockCatalog(items = CATALOG) {
  server.use(
    http.get("*/api/v1/admin/virtual-dj/avatar-catalog", () =>
      HttpResponse.json({ data: items }),
    ),
  )
}

function renderPicker(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe("AvatarPicker", () => {
  it("카탈로그를 그리드로 렌더한다 (이름 + 썸네일)", async () => {
    mockCatalog()
    renderPicker(
      <AvatarPicker mode="single" value={null} onChange={() => {}} />,
    )
    await waitFor(() => {
      expect(screen.getByText("바디 1")).toBeInTheDocument()
    })
    expect(screen.getByText("바디 2")).toBeInTheDocument()
    expect(screen.getByText("바디 3")).toBeInTheDocument()
    expect(screen.getByAltText("바디 1")).toHaveAttribute("src", "t1")
  })

  it("single 모드 — 클릭 시 단일 value(string) 로 onChange", async () => {
    mockCatalog()
    const onChange = vi.fn()
    renderPicker(
      <AvatarPicker mode="single" value={null} onChange={onChange} />,
    )
    await waitFor(() => expect(screen.getByText("바디 1")).toBeInTheDocument())
    await userEvent.click(
      screen.getByRole("button", { name: /바디 1/ }),
    )
    expect(onChange).toHaveBeenCalledWith("u1")
  })

  it("multi 모드 — 토글로 셋(string[]) 누적/해제", async () => {
    mockCatalog()
    const onChange = vi.fn()
    renderPicker(
      <AvatarPicker mode="multi" value={["u1"]} onChange={onChange} />,
    )
    await waitFor(() => expect(screen.getByText("바디 2")).toBeInTheDocument())

    // 미선택 항목 추가
    await userEvent.click(screen.getByRole("button", { name: /바디 2/ }))
    expect(onChange).toHaveBeenCalledWith(["u1", "u2"])

    onChange.mockClear()
    // 이미 선택된 항목 해제
    await userEvent.click(screen.getByRole("button", { name: /바디 1/ }))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it("combinable / standalone 배지를 구분 표기한다", async () => {
    mockCatalog()
    renderPicker(
      <AvatarPicker mode="single" value={null} onChange={() => {}} />,
    )
    await waitFor(() => expect(screen.getByText("바디 1")).toBeInTheDocument())
    expect(screen.getAllByText("합성").length).toBeGreaterThan(0)
    expect(screen.getByText("단독")).toBeInTheDocument()
  })

  it("로드됐으나 카탈로그가 비면 안내", async () => {
    mockCatalog([])
    renderPicker(
      <AvatarPicker mode="single" value={null} onChange={() => {}} />,
    )
    await waitFor(() => {
      expect(
        screen.getByText("표시할 아바타가 없습니다."),
      ).toBeInTheDocument()
    })
  })

  it("로드 에러 시 안내", async () => {
    server.use(
      http.get("*/api/v1/admin/virtual-dj/avatar-catalog", () =>
        HttpResponse.json(
          { status: 500, errorCode: "X", message: "boom" },
          { status: 500 },
        ),
      ),
    )
    renderPicker(
      <AvatarPicker mode="single" value={null} onChange={() => {}} />,
    )
    await waitFor(() => {
      expect(screen.getByText(/불러오지 못했습니다/)).toBeInTheDocument()
    })
  })
})
