import { describe, it, expect, beforeEach } from "vitest"
import { http as msw, HttpResponse } from "msw"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { server } from "@/test/mocks/server"
import { API_BASE_URL } from "@/shared/config/env"
import { useSessionStore } from "@/entities/session"
import { LoginPage } from "./login-page"

function renderAt(initialEntry: { pathname: string; state?: unknown } | string) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Dashboard</div>} />
          <Route path="/password/change" element={<div>ChangePasswordPage</div>} />
          <Route path="/rooms" element={<div>Rooms</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("LoginPage integration", () => {
  beforeEach(() => {
    localStorage.clear()
    useSessionStore.getState().clear()
  })

  it("happy path → / 로 navigate + sessionStore 갱신", async () => {
    const user = userEvent.setup()
    renderAt("/login")
    await user.type(screen.getByLabelText("이메일"), "admin@pfplay.xyz")
    await user.type(screen.getByLabelText("비밀번호"), "ValidPass!1")
    await user.click(screen.getByRole("button", { name: "로그인" }))
    expect(await screen.findByText("Dashboard")).toBeInTheDocument()
    expect(useSessionStore.getState().isAuthenticated).toBe(true)
    expect(useSessionStore.getState().meta?.role).toBe("ADMIN")
  })

  it("401 응답 → form-level 에러 표시", async () => {
    const user = userEvent.setup()
    renderAt("/login")
    await user.type(screen.getByLabelText("이메일"), "wrong@pfplay.xyz")
    await user.type(screen.getByLabelText("비밀번호"), "WrongPass!1")
    await user.click(screen.getByRole("button", { name: "로그인" }))
    expect(await screen.findByText("이메일 또는 비밀번호가 올바르지 않습니다")).toBeInTheDocument()
    expect(useSessionStore.getState().isAuthenticated).toBe(false)
  })

  it("429 응답 → 잠시 후 다시 시도해주세요", async () => {
    server.use(
      msw.post(`${API_BASE_URL}/api/v1/auth/admin/login`, () =>
        HttpResponse.json({ status: 429, errorCode: "RATE-LIMITED", message: "rate limited" }, { status: 429 }),
      ),
    )
    const user = userEvent.setup()
    renderAt("/login")
    await user.type(screen.getByLabelText("이메일"), "admin@pfplay.xyz")
    await user.type(screen.getByLabelText("비밀번호"), "ValidPass!1")
    await user.click(screen.getByRole("button", { name: "로그인" }))
    expect(await screen.findByText("잠시 후 다시 시도해주세요")).toBeInTheDocument()
  })

  it("mustChangePassword=true → /password/change navigate", async () => {
    server.use(
      msw.post(`${API_BASE_URL}/api/v1/auth/admin/login`, () =>
        HttpResponse.json({
          data: {
            tokenType: "Cookie",
            expiresIn: 900,
            issuedAt: "2026-04-28T10:00:00",
            role: "ADMIN",
            mustChangePassword: true,
          },
        }),
      ),
    )
    const user = userEvent.setup()
    renderAt("/login")
    await user.type(screen.getByLabelText("이메일"), "admin@pfplay.xyz")
    await user.type(screen.getByLabelText("비밀번호"), "ValidPass!1")
    await user.click(screen.getByRole("button", { name: "로그인" }))
    expect(await screen.findByText("ChangePasswordPage")).toBeInTheDocument()
  })
})
