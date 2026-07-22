import { describe, it, expect, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { SetBotAvatarDialog } from "../set-bot-avatar-dialog"

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
  userId?: string
  nickname?: string
}) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <SetBotAvatarDialog
        open={props.open ?? true}
        onOpenChange={props.onOpenChange ?? (() => {})}
        userId={props.userId ?? "864530440482800637"}
        nickname={props.nickname ?? "봇세븐"}
      />
    </QueryClientProvider>,
  )
}

describe("SetBotAvatarDialog", () => {
  it("아바타 미선택이면 적용 비활성", async () => {
    mockCatalog()
    renderDialog({})
    await waitFor(() => expect(screen.getByText("바디 1")).toBeInTheDocument())
    expect(screen.getByRole("button", { name: /적용/ })).toBeDisabled()
  })

  it("single 선택 후 적용 → PUT bots/{userId}/avatar {avatarBodyUri}", async () => {
    mockCatalog()
    let captured: { url: string; body: unknown } | null = null
    server.use(
      http.put(
        "*/api/v1/admin/virtual-crew/bots/:userId/avatar",
        async ({ request }) => {
          captured = { url: request.url, body: await request.json() }
          return new HttpResponse(null, { status: 204 })
        },
      ),
    )
    const onOpenChange = vi.fn()
    renderDialog({ userId: "864530440482800637", onOpenChange })
    await waitFor(() => expect(screen.getByText("바디 1")).toBeInTheDocument())

    await userEvent.click(screen.getByRole("button", { name: /바디 1/ }))
    await userEvent.click(screen.getByRole("button", { name: /적용/ }))

    await waitFor(() => expect(captured).not.toBeNull())
    expect(captured!.url).toContain("/bots/864530440482800637/avatar")
    expect(captured!.body).toEqual({ avatarBodyUri: "u1" })
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })
})
