import { describe, it, expect, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { CreateAdministratorDialog } from "../create-administrator-dialog"

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe("CreateAdministratorDialog", () => {
  it("입력 검증 — 이메일 형식 위반 시 에러 표시 + submit 차단", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithClient(<CreateAdministratorDialog open={true} onOpenChange={vi.fn()} />)
    await user.type(screen.getByLabelText(/이메일/), "not-an-email")
    await user.type(screen.getByLabelText(/닉네임/), "운영자")
    await user.click(screen.getByRole("button", { name: "생성" }))
    expect(await screen.findByText(/이메일 형식/)).toBeInTheDocument()
  })

  it("정상 입력 → tempPassword 노출 단계 진입", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithClient(<CreateAdministratorDialog open={true} onOpenChange={vi.fn()} />)
    await user.type(screen.getByLabelText(/이메일/), "newadmin@pfplay.local")
    await user.type(screen.getByLabelText(/닉네임/), "신규운영자")
    await user.click(screen.getByRole("button", { name: "생성" }))
    await waitFor(() =>
      expect(screen.getByText("어드민 생성 완료")).toBeInTheDocument(),
    )
    // mock fixture가 administratorId=99
    expect(screen.getByText(/#99/)).toBeInTheDocument()
    // tempPassword가 fixture 값 그대로 노출
    expect(screen.getByText("TempP@ss-abc123")).toBeInTheDocument()
  })
})
