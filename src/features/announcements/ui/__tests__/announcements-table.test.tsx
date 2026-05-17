import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { AnnouncementsTable } from "../announcements-table"
import {
  maintenanceNoticeFixture,
  emergencyCancelledFixture,
  activeMaintenanceFixture,
  completedMaintenanceFixture,
} from "@/test/mocks/fixtures/announcements"

describe("AnnouncementsTable", () => {
  it("loading — 스켈레톤 표시", () => {
    const { container } = render(
      <AnnouncementsTable rows={[]} isLoading={true} isEmpty={false} onCancelClick={vi.fn()} />,
    )
    expect(container.querySelectorAll("[data-slot='skeleton'], .h-12").length).toBeGreaterThan(0)
  })

  it("empty — 안내 문구", () => {
    render(
      <AnnouncementsTable rows={[]} isLoading={false} isEmpty={true} onCancelClick={vi.fn()} />,
    )
    expect(screen.getByText("송출된 공지가 없습니다")).toBeInTheDocument()
  })

  it("PLANNED 점검 — 철회 버튼만", () => {
    const onCancelClick = vi.fn()
    render(
      <AnnouncementsTable
        rows={[maintenanceNoticeFixture]}
        isLoading={false}
        isEmpty={false}
        onCancelClick={onCancelClick}
      />,
    )
    // 상태 배지 "예정" 표시
    expect(screen.getByText("예정")).toBeInTheDocument()

    // 철회 버튼 존재 + 활성
    const cancelBtn = screen.getByRole("button", {
      name: `공지 #${maintenanceNoticeFixture.id} 철회`,
    })
    expect(cancelBtn).not.toBeDisabled()
    fireEvent.click(cancelBtn)
    expect(onCancelClick).toHaveBeenCalledWith(maintenanceNoticeFixture)

    // 종료시각 조정 / 지금 종료 버튼 없음
    expect(screen.queryByRole("button", { name: `공지 #${maintenanceNoticeFixture.id} 종료시각 조정` })).toBeNull()
    expect(screen.queryByRole("button", { name: `공지 #${maintenanceNoticeFixture.id} 지금 종료` })).toBeNull()
  })

  it("철회된 공지 — 액션 없음 + 철회 배지", () => {
    render(
      <AnnouncementsTable
        rows={[emergencyCancelledFixture]}
        isLoading={false}
        isEmpty={false}
        onCancelClick={vi.fn()}
      />,
    )
    // 상태 배지 "철회" 표시
    expect(screen.getByText("철회")).toBeInTheDocument()

    // 액션 버튼 없음
    expect(screen.queryByRole("button", { name: `공지 #${emergencyCancelledFixture.id} 철회` })).toBeNull()
    expect(screen.queryByRole("button", { name: `공지 #${emergencyCancelledFixture.id} 종료시각 조정` })).toBeNull()
    expect(screen.queryByRole("button", { name: `공지 #${emergencyCancelledFixture.id} 지금 종료` })).toBeNull()
  })

  it("type / severity 라벨 humanize", () => {
    render(
      <AnnouncementsTable
        rows={[maintenanceNoticeFixture]}
        isLoading={false}
        isEmpty={false}
        onCancelClick={vi.fn()}
      />,
    )
    expect(screen.getByText("점검 공지")).toBeInTheDocument()
    expect(screen.getByText("경고")).toBeInTheDocument()
  })

  it("ACTIVE 점검 — 조정/종료/철회 3버튼", () => {
    const onCancelClick = vi.fn()
    const onAdjustClick = vi.fn()
    const onCompleteClick = vi.fn()
    render(
      <AnnouncementsTable
        rows={[activeMaintenanceFixture]}
        isLoading={false}
        isEmpty={false}
        onCancelClick={onCancelClick}
        onAdjustClick={onAdjustClick}
        onCompleteClick={onCompleteClick}
      />,
    )
    // 상태 배지 "진행중" 표시
    expect(screen.getByText("진행중")).toBeInTheDocument()

    // 종료시각 조정 버튼
    const adjustBtn = screen.getByRole("button", {
      name: `공지 #${activeMaintenanceFixture.id} 종료시각 조정`,
    })
    expect(adjustBtn).not.toBeDisabled()
    fireEvent.click(adjustBtn)
    expect(onAdjustClick).toHaveBeenCalledWith(activeMaintenanceFixture)

    // 지금 종료 버튼
    const completeBtn = screen.getByRole("button", {
      name: `공지 #${activeMaintenanceFixture.id} 지금 종료`,
    })
    expect(completeBtn).not.toBeDisabled()
    fireEvent.click(completeBtn)
    expect(onCompleteClick).toHaveBeenCalledWith(activeMaintenanceFixture)

    // 철회 버튼
    const cancelBtn = screen.getByRole("button", {
      name: `공지 #${activeMaintenanceFixture.id} 철회`,
    })
    expect(cancelBtn).not.toBeDisabled()
    fireEvent.click(cancelBtn)
    expect(onCancelClick).toHaveBeenCalledWith(activeMaintenanceFixture)
  })

  it("정상완료 공지 — 액션 없음", () => {
    render(
      <AnnouncementsTable
        rows={[completedMaintenanceFixture]}
        isLoading={false}
        isEmpty={false}
        onCancelClick={vi.fn()}
      />,
    )
    // 상태 배지 "정상완료" 표시
    expect(screen.getByText("정상완료")).toBeInTheDocument()

    // 액션 버튼 없음
    expect(screen.queryByRole("button", { name: `공지 #${completedMaintenanceFixture.id} 철회` })).toBeNull()
    expect(screen.queryByRole("button", { name: `공지 #${completedMaintenanceFixture.id} 종료시각 조정` })).toBeNull()
    expect(screen.queryByRole("button", { name: `공지 #${completedMaintenanceFixture.id} 지금 종료` })).toBeNull()
  })
})
