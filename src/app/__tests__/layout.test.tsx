import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import AppLayout from "../layout"

let mockRole: "ADMIN" | "SUPER_ADMIN" = "ADMIN"

// useSessionStore + useLogout 모킹 (role은 mockRole로 분기)
vi.mock("@/entities/session", () => ({
  useSessionStore: () => ({ meta: { role: mockRole } }),
}))
vi.mock("@/features/logout/api/use-logout", () => ({
  useLogout: () => ({ mutate: vi.fn(), isPending: false }),
}))

function renderLayout() {
  return render(
    <MemoryRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<div>home</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe("AppLayout sidebar", () => {
  beforeEach(() => {
    mockRole = "ADMIN"
  })

  it("회원/파티룸 nav가 enabled로 노출된다", () => {
    renderLayout()
    const member = screen.getByText("회원").closest("a")
    expect(member).toHaveAttribute("href", "/members")
    const partyroom = screen.getByText("파티룸").closest("a")
    expect(partyroom).toHaveAttribute("href", "/partyrooms")
    // /users, /rooms, /scenarios 메뉴 부재 (demo subsystem 삭제)
    expect(screen.queryByText("가상 유저")).toBeNull()
    expect(screen.queryByText("시나리오")).toBeNull()
  })

  it("ADMIN role: 아바타 nav 미노출 (G5.1 role gate)", () => {
    mockRole = "ADMIN"
    renderLayout()
    expect(screen.queryByText("아바타")).toBeNull()
  })

  it("SUPER_ADMIN role: 아바타 nav 노출 (G5.1 role gate)", () => {
    mockRole = "SUPER_ADMIN"
    renderLayout()
    const avatar = screen.getByText("아바타").closest("a")
    expect(avatar).toHaveAttribute("href", "/avatars/bodies")
  })
})
