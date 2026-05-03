import { describe, expect, it, vi, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { UpdateMetaDialog } from "@/features/partyrooms/ui/mutation-dialogs/update-meta-dialog"

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe("UpdateMetaDialog", () => {
  afterEach(() => vi.restoreAllMocks())

  it("renders title + 3 fields when open", () => {
    renderWithClient(
      <UpdateMetaDialog
        partyroomId={1}
        currentTitle="기존 제목"
        currentIntroduction="기존 소개"
        currentPlaybackTimeLimit={20}
        open={true}
        onOpenChange={vi.fn()}
      />,
    )
    expect(screen.getByText(/파티룸 메타 수정/)).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: /제목/ })).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: /소개/ })).toBeInTheDocument()
    expect(screen.getByRole("spinbutton", { name: /재생 시간 제한/ })).toBeInTheDocument()
  })

  it("uses currentTitle as title placeholder", () => {
    renderWithClient(
      <UpdateMetaDialog
        partyroomId={1}
        currentTitle="기존 제목"
        currentIntroduction={null}
        currentPlaybackTimeLimit={null}
        open={true}
        onOpenChange={vi.fn()}
      />,
    )
    const input = screen.getByRole("textbox", { name: /제목/ }) as HTMLInputElement
    expect(input.placeholder).toBe("기존 제목")
  })

  it("does not render when open=false", () => {
    renderWithClient(
      <UpdateMetaDialog
        partyroomId={1}
        currentTitle=""
        currentIntroduction={null}
        currentPlaybackTimeLimit={null}
        open={false}
        onOpenChange={vi.fn()}
      />,
    )
    expect(screen.queryByText(/파티룸 메타 수정/)).not.toBeInTheDocument()
  })

  it("submit button labeled '수정'", () => {
    renderWithClient(
      <UpdateMetaDialog
        partyroomId={1}
        currentTitle=""
        currentIntroduction={null}
        currentPlaybackTimeLimit={null}
        open={true}
        onOpenChange={vi.fn()}
      />,
    )
    expect(screen.getByRole("button", { name: "수정" })).toBeInTheDocument()
  })
})
