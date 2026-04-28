import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import AppLayout from "../layout"

// useSessionStore + useLogout 모킹
vi.mock("@/entities/session", () => ({
  useSessionStore: () => ({ meta: { role: "ADMIN" } }),
}))
vi.mock("@/features/logout/api/use-logout", () => ({
  useLogout: () => ({ mutate: vi.fn(), isPending: false }),
}))

describe("AppLayout sidebar", () => {
  it("회원/파티룸 nav가 enabled로 노출된다", () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<div>home</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    const member = screen.getByText("회원").closest("a")
    expect(member).toHaveAttribute("href", "/members")
    const partyroom = screen.getByText("파티룸").closest("a")
    expect(partyroom).toHaveAttribute("href", "/partyrooms")
    // /users, /rooms, /scenarios 메뉴 부재 (demo subsystem 삭제)
    expect(screen.queryByText("가상 유저")).toBeNull()
    expect(screen.queryByText("시나리오")).toBeNull()
  })
})
