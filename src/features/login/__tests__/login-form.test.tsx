import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { LoginForm } from "../ui/login-form"

function renderForm() {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } })
  const onSuccess = vi.fn()
  render(
    <QueryClientProvider client={qc}>
      <LoginForm onSuccess={onSuccess} />
    </QueryClientProvider>,
  )
  return { onSuccess }
}

describe("LoginForm 검증", () => {
  beforeEach(() => localStorage.clear())

  it("invalid email format → 이메일 형식 에러", async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText("이메일"), "not-an-email")
    await user.type(screen.getByLabelText("비밀번호"), "ValidPass!1")
    await user.click(screen.getByRole("button", { name: "로그인" }))
    expect(await screen.findByText("이메일 형식이 올바르지 않습니다")).toBeInTheDocument()
  })

  it("short password → 8자 이상 에러", async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText("이메일"), "admin@pfplay.xyz")
    await user.type(screen.getByLabelText("비밀번호"), "short")
    await user.click(screen.getByRole("button", { name: "로그인" }))
    expect(await screen.findByText("8자 이상 입력해주세요")).toBeInTheDocument()
  })
})
