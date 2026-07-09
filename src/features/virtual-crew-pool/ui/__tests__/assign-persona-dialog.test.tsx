import { describe, it, expect } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { AssignPersonaDialog } from "../assign-persona-dialog"

function mockPersonas(data: unknown, status = 200) {
  server.use(
    http.get("*/api/v1/admin/virtual-crew/personas", () =>
      status === 200
        ? HttpResponse.json({ data })
        : HttpResponse.json(
            { status, errorCode: null, message: "x" },
            { status },
          ),
    ),
  )
}

function renderDialog() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <AssignPersonaDialog botIds={[1, 2]} open onOpenChange={() => {}} />
    </QueryClientProvider>,
  )
}

describe("AssignPersonaDialog — 페르소나 빈/에러 상태", () => {
  it("활성 페르소나가 없으면 안내 문구를 보이고 Select 를 숨긴다", async () => {
    mockPersonas([{ id: 1, name: "비활성봇", active: false }])
    renderDialog()
    await waitFor(() =>
      expect(screen.getByText(/활성 페르소나가 없습니다/)).toBeInTheDocument(),
    )
    expect(screen.queryByLabelText("페르소나 선택")).not.toBeInTheDocument()
  })

  it("페르소나 로드 실패 시 에러 문구를 보인다 (Select 미노출)", async () => {
    mockPersonas(null, 500)
    renderDialog()
    await waitFor(() =>
      expect(screen.getByText(/불러오지 못했습니다/)).toBeInTheDocument(),
    )
    expect(screen.queryByLabelText("페르소나 선택")).not.toBeInTheDocument()
  })

  it("활성 페르소나가 있으면 Select 를 노출한다", async () => {
    mockPersonas([{ id: 1, name: "활성봇", active: true }])
    renderDialog()
    await waitFor(() =>
      expect(screen.getByLabelText("페르소나 선택")).toBeInTheDocument(),
    )
  })
})
