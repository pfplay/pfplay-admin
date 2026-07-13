import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"

const listMock = vi.fn()
vi.mock("@/features/partyrooms/api/use-partyrooms-list", () => ({
  usePartyroomsList: () => listMock(),
}))
vi.mock("@/features/partyrooms/api/use-replace-virtual-crew", () => ({
  useReplaceVirtualCrew: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock("@/features/partyrooms/api/use-drain-resources-virtual-crew", () => ({
  useDrainResourcesVirtualCrew: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock("@/features/partyrooms/ui/mutation-dialogs/virtual-crew-bulk-dialog", () => ({
  VirtualCrewBulkDialog: ({ selectedIds }: { selectedIds: number[] }) => (
    <div data-testid="bulk-dialog">selected:{selectedIds.join(",")}</div>
  ),
}))

import { CrewRoomsPageContent } from "../crew-rooms-page-content"

const rooms = [
  { partyroomId: 1, title: "운영중 방", virtualCrew: { status: "MANAGED", targetCount: 8, botDjCount: 2 } },
  { partyroomId: 2, title: "크루 없는 방", virtualCrew: null },
]

function renderRooms() {
  return render(
    <MemoryRouter>
      <CrewRoomsPageContent />
    </MemoryRouter>,
  )
}

describe("CrewRoomsPageContent", () => {
  beforeEach(() => {
    listMock.mockReturnValue({ data: { content: rooms }, isLoading: false, isError: false })
  })

  it("방 목록과 총원/DJ를 렌더한다", () => {
    renderRooms()
    expect(screen.getByText("운영중 방")).toBeInTheDocument()
    expect(screen.getByText("크루 없는 방")).toBeInTheDocument()
    expect(screen.getByText("운영중")).toBeInTheDocument()
  })

  it("MANAGED 방은 재배치/리소스 회수 활성, 크루 없는 방은 비활성", () => {
    renderRooms()
    const managedRow = screen.getByText("운영중 방").closest("tr")!
    expect(within(managedRow).getByText("재배치")).toBeEnabled()
    expect(within(managedRow).getByText("리소스 회수")).toBeEnabled()
    const noneRow = screen.getByText("크루 없는 방").closest("tr")!
    expect(within(noneRow).getByText("재배치")).toBeDisabled()
    expect(within(noneRow).getByText("리소스 회수")).toBeDisabled()
  })

  it("선택 전 일괄 버튼 비활성 → 방 선택 시 활성 + 선택 ID 전달", () => {
    renderRooms()
    const bulkBtn = screen.getByRole("button", { name: /선택 방 설정\/적용/ })
    expect(bulkBtn).toBeDisabled()

    fireEvent.click(screen.getByLabelText("운영중 방 선택"))
    expect(bulkBtn).toBeEnabled()
    expect(screen.getByTestId("bulk-dialog")).toHaveTextContent("selected:1")
  })
})
