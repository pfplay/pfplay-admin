import { describe, it, expect, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { DistributeAvatarsDialog } from "../distribute-avatars-dialog"

const CATALOG = [
  {
    bodyUri: "u1",
    name: "바디 1",
    thumbnailUri: "t1",
    combinable: true,
    obtainableType: "BASIC",
  },
  {
    bodyUri: "u2",
    name: "바디 2",
    thumbnailUri: "t2",
    combinable: false,
    obtainableType: null,
  },
]

function mockCatalog() {
  server.use(
    http.get("*/api/v1/admin/virtual-crew/avatar-catalog", () =>
      HttpResponse.json({ data: CATALOG }),
    ),
  )
}

function renderDialog(props: {
  open?: boolean
  onOpenChange?: (o: boolean) => void
  botIds?: string[]
}) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <DistributeAvatarsDialog
        open={props.open ?? true}
        onOpenChange={props.onOpenChange ?? (() => {})}
        botIds={props.botIds ?? ["1", "2"]}
      />
    </QueryClientProvider>,
  )
}

describe("DistributeAvatarsDialog", () => {
  it("셋 미선택이면 배분 비활성", async () => {
    mockCatalog()
    renderDialog({})
    await waitFor(() => expect(screen.getByText("바디 1")).toBeInTheDocument())
    expect(screen.getByRole("button", { name: /배분/ })).toBeDisabled()
  })

  it("셋 선택 후 배분 → POST distribute {botIds, bodyUris} + 결과 요약", async () => {
    mockCatalog()
    let captured: unknown = null
    server.use(
      http.post(
        "*/api/v1/admin/virtual-crew/bots/avatar/distribute",
        async ({ request }) => {
          captured = await request.json()
          return HttpResponse.json({
            data: {
              assigned: [
                { userId: "1", avatarBodyUri: "u1" },
                { userId: "2", avatarBodyUri: "u2" },
              ],
            },
          })
        },
      ),
    )
    renderDialog({ botIds: ["1", "2"] })
    await waitFor(() => expect(screen.getByText("바디 1")).toBeInTheDocument())

    await userEvent.click(screen.getByRole("button", { name: /바디 1/ }))
    await userEvent.click(screen.getByRole("button", { name: /바디 2/ }))
    await userEvent.click(screen.getByRole("button", { name: /배분/ }))

    await waitFor(() => expect(captured).not.toBeNull())
    expect(captured).toEqual({ botIds: ["1", "2"], bodyUris: ["u1", "u2"] })

    // 결과 요약 표기
    await waitFor(() =>
      expect(
        screen.getByText("2명에게 아바타를 배분했습니다."),
      ).toBeInTheDocument(),
    )
  })

  it("성공 후에도 결과 표기 동안 다이얼로그 유지(닫기는 사용자)", async () => {
    mockCatalog()
    server.use(
      http.post(
        "*/api/v1/admin/virtual-crew/bots/avatar/distribute",
        () =>
          HttpResponse.json({
            data: { assigned: [{ userId: "1", avatarBodyUri: "u1" }] },
          }),
      ),
    )
    const onOpenChange = vi.fn()
    renderDialog({ botIds: ["1"], onOpenChange })
    await waitFor(() => expect(screen.getByText("바디 1")).toBeInTheDocument())
    await userEvent.click(screen.getByRole("button", { name: /바디 1/ }))
    await userEvent.click(screen.getByRole("button", { name: /배분/ }))
    await waitFor(() =>
      expect(
        screen.getByText("1명에게 아바타를 배분했습니다."),
      ).toBeInTheDocument(),
    )
    // 결과 화면 유지 — 자동 close 호출 안 함
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})
