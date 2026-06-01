import { describe, it, expect } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { PoolPageContent } from "../pool-page-content"

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <PoolPageContent />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("PoolPageContent", () => {
  it("요약 로드 후 수치 + 폼 렌더", async () => {
    server.use(
      http.get("*/api/v1/admin/virtual-dj/pool", () =>
        HttpResponse.json({
          data: {
            total: 8,
            idle: 2,
            placed: [{ partyroomId: 1, partyroomTitle: "메인", botCount: 6 }],
          },
        }),
      ),
    )
    renderPage()
    await waitFor(() => {
      expect(screen.getByText("8")).toBeInTheDocument()
    })
    expect(screen.getByText("메인")).toBeInTheDocument()
    expect(screen.getByLabelText(/봇 수/)).toBeInTheDocument()
  })

  it("로드 에러 시 에러 안내", async () => {
    server.use(
      http.get("*/api/v1/admin/virtual-dj/pool", () =>
        HttpResponse.json(
          { status: 500, errorCode: "X", message: "boom" },
          { status: 500 },
        ),
      ),
    )
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/불러오지 못했습니다/)).toBeInTheDocument()
    })
  })
})
