import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { AnnouncementsTable } from "../announcements-table"
import {
  maintenanceNoticeFixture,
  emergencyCancelledFixture,
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

  it("활성 공지 — 취소 버튼 활성", () => {
    const onCancelClick = vi.fn()
    render(
      <AnnouncementsTable
        rows={[maintenanceNoticeFixture]}
        isLoading={false}
        isEmpty={false}
        onCancelClick={onCancelClick}
      />,
    )
    const btn = screen.getByRole("button", {
      name: `공지 #${maintenanceNoticeFixture.id} 취소`,
    })
    expect(btn).not.toBeDisabled()
    fireEvent.click(btn)
    expect(onCancelClick).toHaveBeenCalledWith(maintenanceNoticeFixture)
  })

  it("취소된 공지 — 버튼 비활성 + '취소됨' 라벨", () => {
    render(
      <AnnouncementsTable
        rows={[emergencyCancelledFixture]}
        isLoading={false}
        isEmpty={false}
        onCancelClick={vi.fn()}
      />,
    )
    const btn = screen.getByRole("button", {
      name: `공지 #${emergencyCancelledFixture.id} 취소`,
    })
    expect(btn).toBeDisabled()
    expect(btn.textContent).toBe("취소됨")
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
})
