import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"

const poolMock = vi.fn()
const songPacksMock = vi.fn()
const chatMock = vi.fn()
vi.mock("@/features/virtual-crew-pool/api/use-pool-summary", () => ({
  usePoolSummary: () => poolMock(),
}))
vi.mock("@/features/virtual-crew-song-packs/api/use-song-packs", () => ({
  useSongPacks: () => songPacksMock(),
}))
vi.mock("@/features/virtual-crew-chat-config/api/use-chat-config", () => ({
  useChatConfig: () => chatMock(),
}))

import { VirtualCrewHubPageContent } from "../hub-page-content"

function renderHub() {
  return render(
    <MemoryRouter>
      <VirtualCrewHubPageContent />
    </MemoryRouter>,
  )
}

describe("VirtualCrewHubPageContent", () => {
  beforeEach(() => {
    poolMock.mockReturnValue({
      data: { total: 50, idle: 12, placed: [{ partyroomId: 1, partyroomTitle: "A", botCount: 6 }] },
      isLoading: false,
    })
    songPacksMock.mockReturnValue({ data: [{ id: 1 }, { id: 2 }], isLoading: false })
    chatMock.mockReturnValue({ data: { chatEnabled: false }, isLoading: false })
  })

  it("STEP 1~4 카드와 봇/송팩 상태를 순서대로 노출한다", () => {
    renderHub()
    expect(screen.getByText("봇 풀")).toBeInTheDocument()
    expect(screen.getByText("송팩")).toBeInTheDocument()
    expect(screen.getByText("크루 배치 & 운영")).toBeInTheDocument()
    expect(screen.getByText("유휴 12 / 전체 50")).toBeInTheDocument()
    // 배치된 방/배치봇 요약
    expect(screen.getByText("방 1 · 배치봇 6")).toBeInTheDocument()
    // 정상 상태면 경고 없음
    expect(screen.queryByText(/봇 계정이 없습니다/)).toBeNull()
    expect(screen.queryByText(/송팩이 없습니다/)).toBeNull()
  })

  it("봇/송팩이 없으면 전제조건 경고를 노출한다", () => {
    poolMock.mockReturnValue({ data: { total: 0, idle: 0, placed: [] }, isLoading: false })
    songPacksMock.mockReturnValue({ data: [], isLoading: false })
    renderHub()
    expect(screen.getByText(/봇 계정이 없습니다/)).toBeInTheDocument()
    expect(screen.getByText(/송팩이 없습니다/)).toBeInTheDocument()
  })

  it("채팅 ON이면 배지에 반영된다", () => {
    chatMock.mockReturnValue({ data: { chatEnabled: true }, isLoading: false })
    renderHub()
    expect(screen.getByText("채팅 ON")).toBeInTheDocument()
  })
})
