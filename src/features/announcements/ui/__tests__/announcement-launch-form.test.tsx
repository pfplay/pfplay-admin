import { describe, it, expect, afterEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AnnouncementLaunchForm } from "../announcement-launch-form"

function renderForm() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/announcements"]}>
        <Routes>
          <Route path="/announcements" element={<AnnouncementLaunchForm />} />
          <Route
            path="/announcements/history"
            element={<div data-testid="history-page">history</div>}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

// schema 의 미래 시각 검증은 local timezone 기반 — toISOString() (UTC) 을 쓰면 KST 환경에서 9시간 어긋남.
const futureLocal = (offsetMs: number) => {
  const d = new Date(Date.now() + offsetMs)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

describe("AnnouncementLaunchForm", () => {
  afterEach(() => vi.restoreAllMocks())

  it("초기 상태 — MAINTENANCE_NOTICE 선택, 점검 시작/종료 입력 노출", () => {
    renderForm()
    expect(screen.getByLabelText("점검 시작")).toBeInTheDocument()
    expect(screen.getByLabelText("점검 종료")).toBeInTheDocument()
    expect(screen.queryByLabelText(/만료 시각/)).not.toBeInTheDocument()
  })

  it("type 전환 (점검 → 이벤트) — schedule 필드 사라지고 expiresAt 노출", () => {
    renderForm()
    fireEvent.click(screen.getByRole("radio", { name: /이벤트/ }))
    expect(screen.queryByLabelText("점검 시작")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("점검 종료")).not.toBeInTheDocument()
    expect(screen.getByLabelText(/만료 시각/)).toBeInTheDocument()
  })

  it("severity radio 토글", () => {
    renderForm()
    const critical = screen.getByRole("radio", { name: "위급" })
    expect(critical.getAttribute("aria-checked")).toBe("false")
    fireEvent.click(critical)
    expect(critical.getAttribute("aria-checked")).toBe("true")
  })

  it("빈 form 제출 — i18n 필수 메시지 노출 (한쪽만 작성 차단)", () => {
    renderForm()
    fireEvent.click(screen.getByRole("button", { name: /공지 발사/ }))
    expect(screen.getByText("한국어 제목은 필수입니다")).toBeInTheDocument()
    expect(screen.getByText("영문 제목은 필수입니다")).toBeInTheDocument()
    expect(screen.getByText("한국어 본문은 필수입니다")).toBeInTheDocument()
    expect(screen.getByText("영문 본문은 필수입니다")).toBeInTheDocument()
  })

  it("MAINTENANCE_NOTICE — schedule 누락 시 메시지", () => {
    renderForm()
    fireEvent.change(screen.getByLabelText("제목 (한국어)"), {
      target: { value: "k" },
    })
    fireEvent.change(screen.getByLabelText("제목 (English)"), {
      target: { value: "e" },
    })
    fireEvent.change(screen.getByLabelText("본문 (한국어)"), {
      target: { value: "kb" },
    })
    fireEvent.change(screen.getByLabelText("본문 (English)"), {
      target: { value: "eb" },
    })
    fireEvent.click(screen.getByRole("button", { name: /공지 발사/ }))
    expect(screen.getByText("점검 시작 시각은 필수입니다")).toBeInTheDocument()
    expect(screen.getByText("점검 종료 시각은 필수입니다")).toBeInTheDocument()
  })

  it("정상 입력 + 발사 → /announcements/history 로 이동", async () => {
    renderForm()
    fireEvent.change(screen.getByLabelText("제목 (한국어)"), {
      target: { value: "정기 점검" },
    })
    fireEvent.change(screen.getByLabelText("제목 (English)"), {
      target: { value: "Maintenance" },
    })
    fireEvent.change(screen.getByLabelText("본문 (한국어)"), {
      target: { value: "본문" },
    })
    fireEvent.change(screen.getByLabelText("본문 (English)"), {
      target: { value: "Body" },
    })
    fireEvent.change(screen.getByLabelText("점검 시작"), {
      target: { value: futureLocal(60 * 60 * 1000) },
    })
    fireEvent.change(screen.getByLabelText("점검 종료"), {
      target: { value: futureLocal(2 * 60 * 60 * 1000) },
    })
    fireEvent.click(screen.getByRole("button", { name: /공지 발사/ }))
    await waitFor(() => {
      expect(screen.getByTestId("history-page")).toBeInTheDocument()
    })
  })
})
