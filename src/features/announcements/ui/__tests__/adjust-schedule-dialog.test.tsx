import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { AdjustScheduleDialog } from "../adjust-schedule-dialog"
import { activeMaintenanceFixture } from "@/test/mocks/fixtures/announcements"

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>
}

// activeMaintenanceFixture.scheduledEndAt = "2026-05-04T04:00:00"
// datetime-local input value strips seconds → "2026-05-04T04:00"

describe("AdjustScheduleDialog", () => {
  afterEach(() => vi.restoreAllMocks())

  it("ACTIVE 공지 target 시 렌더링되고 input 이 scheduledEndAt 으로 초기화됨", () => {
    render(
      wrap(
        <AdjustScheduleDialog
          target={activeMaintenanceFixture}
          onOpenChange={vi.fn()}
        />,
      ),
    )
    expect(screen.getByText("종료 시각 조정")).toBeInTheDocument()
    const input = screen.getByLabelText("종료 시각") as HTMLInputElement
    // strips seconds: "2026-05-04T04:00:00" → "2026-05-04T04:00"
    expect(input.value).toBe("2026-05-04T04:00")
  })

  it("target=null 시 렌더링 안 됨", () => {
    render(wrap(<AdjustScheduleDialog target={null} onOpenChange={vi.fn()} />))
    expect(screen.queryByText("종료 시각 조정")).not.toBeInTheDocument()
  })

  it("+30분 버튼 클릭 시 input 이 scheduledEndAt 기준 +30분으로 변경됨", () => {
    render(
      wrap(
        <AdjustScheduleDialog
          target={activeMaintenanceFixture}
          onOpenChange={vi.fn()}
        />,
      ),
    )
    const input = screen.getByLabelText("종료 시각") as HTMLInputElement
    expect(input.value).toBe("2026-05-04T04:00")

    fireEvent.click(screen.getByRole("button", { name: "+30분" }))

    // 04:00 + 30min = 04:30
    expect(input.value).toBe("2026-05-04T04:30")
  })

  it("확정 버튼 클릭 시 mutation.mutate 가 올바른 payload 로 호출됨", async () => {
    let patchBody: unknown
    let patchId: string | undefined
    server.use(
      http.patch("*/api/v1/admin/announcements/:id/schedule", async ({ params, request }) => {
        patchId = params.id as string
        patchBody = await request.json()
        return HttpResponse.json({ data: null })
      }),
    )
    const onOpenChange = vi.fn()
    render(
      wrap(
        <AdjustScheduleDialog
          target={activeMaintenanceFixture}
          onOpenChange={onOpenChange}
        />,
      ),
    )
    fireEvent.click(screen.getByRole("button", { name: "확정" }))
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(patchId).toBe(String(activeMaintenanceFixture.id))
    // normalized back to seconds: "2026-05-04T04:00" → "2026-05-04T04:00:00"
    expect(patchBody).toEqual({ scheduledEndAt: "2026-05-04T04:00:00" })
  })
})
