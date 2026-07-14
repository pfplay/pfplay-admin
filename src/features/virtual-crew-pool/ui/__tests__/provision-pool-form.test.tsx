import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const provisionPool = vi.fn<(count: number) => Promise<void>>()
vi.mock("../../api/pool-api", () => ({
  provisionPool: (count: number) => provisionPool(count),
  getPoolSummary: vi.fn(),
}))

import { ProvisionPoolForm } from "../provision-pool-form"

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>
}

describe("ProvisionPoolForm", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("유효한 count 제출 → provisionPool(parsed number) 호출", async () => {
    provisionPool.mockResolvedValue(undefined)
    const u = userEvent.setup()
    render(wrap(<ProvisionPoolForm />))
    await u.clear(screen.getByLabelText(/봇 수/))
    await u.type(screen.getByLabelText(/봇 수/), "30")
    await u.click(screen.getByRole("button", { name: /충원/ }))
    await waitFor(() => {
      expect(provisionPool).toHaveBeenCalledWith(30)
    })
  })

  it("0 입력 시 검증 차단 — provisionPool 미호출 + 에러 노출", async () => {
    const u = userEvent.setup()
    render(wrap(<ProvisionPoolForm />))
    await u.clear(screen.getByLabelText(/봇 수/))
    await u.type(screen.getByLabelText(/봇 수/), "0")
    await u.click(screen.getByRole("button", { name: /충원/ }))
    expect(provisionPool).not.toHaveBeenCalled()
    expect(screen.getByText(/최소 1 이상/)).toBeInTheDocument()
  })

  it("501 입력 시 검증 차단", async () => {
    const u = userEvent.setup()
    render(wrap(<ProvisionPoolForm />))
    await u.clear(screen.getByLabelText(/봇 수/))
    await u.type(screen.getByLabelText(/봇 수/), "501")
    await u.click(screen.getByRole("button", { name: /충원/ }))
    expect(provisionPool).not.toHaveBeenCalled()
    expect(screen.getByText(/최대 500 이하/)).toBeInTheDocument()
  })

  it("성공 후 입력값을 기본값으로 초기화(중복 충원 방지)", async () => {
    provisionPool.mockResolvedValue(undefined)
    const u = userEvent.setup()
    render(wrap(<ProvisionPoolForm />))
    const input = screen.getByLabelText(/봇 수/) as HTMLInputElement
    // 1. 초기값 확인
    expect(input.value).toBe("10")
    // 2. 값 변경
    await u.clear(input)
    await u.type(input, "50")
    expect(input.value).toBe("50")
    // 3. 제출
    await u.click(screen.getByRole("button", { name: /충원/ }))
    // 4. 성공 후 기본값으로 초기화됨 확인
    await waitFor(() => {
      expect(input.value).toBe("10")
    })
  })
})
