import { describe, it, expect, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useSessionStore } from "@/entities/session"
import { ChangePasswordPage } from "./change-password-page"

describe("ChangePasswordPage integration", () => {
  beforeEach(() => {
    localStorage.clear()
    useSessionStore.getState().setSession({
      role: "ADMIN", mustChangePassword: true,
      issuedAt: "2026-04-28T10:00:00.000Z", expiresAt: "2026-04-28T10:15:00.000Z",
    })
  })

  it("성공(204) → clearMustChangePassword + / 로 navigate", async () => {
    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const user = userEvent.setup()
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/password/change"]}>
          <Routes>
            <Route path="/password/change" element={<ChangePasswordPage />} />
            <Route path="/" element={<div>Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
    await user.type(screen.getByLabelText("현재 비밀번호"), "OldPass!1ab")
    await user.type(screen.getByLabelText("새 비밀번호"), "NewPass!1AB")
    await user.type(screen.getByLabelText("새 비밀번호 확인"), "NewPass!1AB")
    await user.click(screen.getByRole("button", { name: "변경" }))
    expect(await screen.findByText("Dashboard")).toBeInTheDocument()
    expect(useSessionStore.getState().meta?.mustChangePassword).toBe(false)
  })
})
