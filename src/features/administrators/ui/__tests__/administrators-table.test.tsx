import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { AdministratorsTable } from "../administrators-table"
import {
  superAdminFixture,
  adminActiveFixture,
  adminMustChangePasswordFixture,
  adminRevokedFixture,
  adminWithoutMemberFixture,
} from "@/test/mocks/fixtures/administrators"

describe("AdministratorsTable", () => {
  it("loaded — role badge / status badge / mustChangePassword 표시", () => {
    render(
      <MemoryRouter>
        <AdministratorsTable
          rows={[superAdminFixture, adminActiveFixture, adminMustChangePasswordFixture]}
          isLoading={false}
          isEmpty={false}
        />
      </MemoryRouter>,
    )
    expect(screen.getByText("슈퍼어드민")).toBeInTheDocument()
    expect(screen.getAllByText("어드민")).toHaveLength(2)
    expect(screen.getAllByText("활성")).toHaveLength(3)
    expect(screen.getByText("필요")).toBeInTheDocument()
  })

  it("revoked row → '회수됨' badge + tooltip", () => {
    render(
      <MemoryRouter>
        <AdministratorsTable
          rows={[adminRevokedFixture]}
          isLoading={false}
          isEmpty={false}
        />
      </MemoryRouter>,
    )
    const revokedBadge = screen.getByText("회수됨")
    expect(revokedBadge).toBeInTheDocument()
    expect(revokedBadge).toHaveAttribute("title", expect.stringContaining("회수"))
  })

  it("memberId/nickname null → '—' fallback", () => {
    const { container } = render(
      <MemoryRouter>
        <AdministratorsTable
          rows={[adminWithoutMemberFixture]}
          isLoading={false}
          isEmpty={false}
        />
      </MemoryRouter>,
    )
    // 닉네임 셀이 dash placeholder 노출
    expect(container.textContent).toContain("—")
  })

  it("empty 메시지", () => {
    render(
      <MemoryRouter>
        <AdministratorsTable rows={[]} isLoading={false} isEmpty={true} />
      </MemoryRouter>,
    )
    expect(screen.getByText(/어드민이 없습니다/)).toBeInTheDocument()
  })

  it("isLoading → skeleton 5개", () => {
    const { container } = render(
      <MemoryRouter>
        <AdministratorsTable rows={[]} isLoading={true} isEmpty={false} />
      </MemoryRouter>,
    )
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(5)
  })

  it("row click → /administrators/:id 라우팅", () => {
    render(
      <MemoryRouter initialEntries={["/administrators"]}>
        <Routes>
          <Route
            path="/administrators"
            element={
              <AdministratorsTable
                rows={[adminActiveFixture]}
                isLoading={false}
                isEmpty={false}
              />
            }
          />
          <Route path="/administrators/:id" element={<div>detail</div>} />
        </Routes>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText(adminActiveFixture.email))
    expect(screen.getByText("detail")).toBeInTheDocument()
  })
})
