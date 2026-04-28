import { describe, it, expect, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { useSessionStore } from "@/entities/session"
import { ProtectedRoute } from "../protected-route"

function ShowReturnTo() {
  const location = useLocation()
  const state = location.state as { returnTo?: string } | null
  return <div>login + returnTo={state?.returnTo ?? "(none)"}</div>
}

function renderAt(initial: string) {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/login" element={<ShowReturnTo />} />
        <Route path="/password/change" element={<div>ChangePassword</div>} />
        <Route path="/rooms" element={<ProtectedRoute><div>Rooms</div></ProtectedRoute>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    localStorage.clear()
    useSessionStore.getState().clear()
  })

  it("미인증 + /rooms → /login + state.returnTo='/rooms'", () => {
    renderAt("/rooms")
    expect(screen.getByText("login + returnTo=/rooms")).toBeInTheDocument()
  })

  it("인증 + mustChangePassword=true + /rooms → /password/change", () => {
    useSessionStore.getState().setSession({
      role: "ADMIN", mustChangePassword: true,
      issuedAt: "2026-04-28T10:00:00.000Z", expiresAt: "2026-04-28T10:15:00.000Z",
    })
    renderAt("/rooms")
    expect(screen.getByText("ChangePassword")).toBeInTheDocument()
  })
})
