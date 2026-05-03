import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AdministratorsActionsDropdown } from "../administrators-actions-dropdown"
import {
  adminActiveFixture,
  adminRevokedFixture,
  adminWithoutMemberFixture,
} from "@/test/mocks/fixtures/administrators"

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe("AdministratorsActionsDropdown — 활성 / 회수 / 멤버 부재 분기", () => {
  afterEach(() => vi.restoreAllMocks())

  it("활성 + 멤버 있음: 닉네임 변경 / 비번 리셋 / 권한 회수 enabled, 멤버 연결 disabled", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithClient(<AdministratorsActionsDropdown administrator={adminActiveFixture} />)
    await user.click(screen.getByRole("button", { name: "작업" }))
    expect(await screen.findByRole("menuitem", { name: /닉네임 변경/ })).not.toHaveAttribute(
      "data-disabled",
    )
    expect(screen.getByRole("menuitem", { name: /비밀번호 리셋/ })).not.toHaveAttribute(
      "data-disabled",
    )
    expect(screen.getByRole("menuitem", { name: /권한 회수/ })).not.toHaveAttribute(
      "data-disabled",
    )
    expect(screen.getByRole("menuitem", { name: /멤버 프로필 연결/ })).toHaveAttribute(
      "data-disabled",
    )
  })

  it("회수됨: 모든 액션 disabled", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithClient(<AdministratorsActionsDropdown administrator={adminRevokedFixture} />)
    await user.click(screen.getByRole("button", { name: "작업" }))
    const items = await screen.findAllByRole("menuitem")
    items.forEach((item) => expect(item).toHaveAttribute("data-disabled"))
  })

  it("활성 + 멤버 미연결: 멤버 연결 enabled, 닉네임 변경 disabled", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithClient(
      <AdministratorsActionsDropdown administrator={adminWithoutMemberFixture} />,
    )
    await user.click(screen.getByRole("button", { name: "작업" }))
    expect(
      await screen.findByRole("menuitem", { name: /멤버 프로필 연결/ }),
    ).not.toHaveAttribute("data-disabled")
    expect(screen.getByRole("menuitem", { name: /닉네임 변경/ })).toHaveAttribute(
      "data-disabled",
    )
  })

  it("활성 + 권한 회수 클릭 → 회수 dialog open", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithClient(<AdministratorsActionsDropdown administrator={adminActiveFixture} />)
    await user.click(screen.getByRole("button", { name: "작업" }))
    await user.click(await screen.findByRole("menuitem", { name: /권한 회수/ }))
    expect(screen.getByText(/권한을 회수합니다/)).toBeInTheDocument()
  })
})
