import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ChangePasswordForm } from "../ui/change-password-form"

function renderForm() {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <ChangePasswordForm onSuccess={() => {}} />
    </QueryClientProvider>,
  )
}

describe("ChangePasswordForm", () => {
  it("newPassword === currentPassword → 현재 비밀번호와 달라야 합니다", async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText("현재 비밀번호"), "Password!1AB")
    await user.type(screen.getByLabelText("새 비밀번호"), "Password!1AB")
    await user.type(screen.getByLabelText("새 비밀번호 확인"), "Password!1AB")
    await user.click(screen.getByRole("button", { name: "변경" }))
    expect(await screen.findByText("현재 비밀번호와 달라야 합니다")).toBeInTheDocument()
  })
})
