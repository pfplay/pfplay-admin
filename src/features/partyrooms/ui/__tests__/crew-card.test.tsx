import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { CrewCard } from "@/features/partyrooms/ui/crew-card"
import type { CrewSummary } from "@/entities/partyroom"

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient()
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>
}
const crew = (over: Partial<CrewSummary>): CrewSummary => ({
  crewId: 14,
  memberId: 99,
  gradeType: "LISTENER",
  nickname: "dj-kim",
  enteredAt: "2026-05-16T00:00:00",
  ...over,
})

describe("CrewCard", () => {
  it("empty state", () => {
    render(wrap(<CrewCard partyroomId={3} crews={[]} />))
    expect(screen.getByText("크루 없음")).toBeInTheDocument()
  })

  it("HOST row: expel button disabled with tooltip text", () => {
    render(
      wrap(<CrewCard partyroomId={3} crews={[crew({ gradeType: "HOST" })]} />),
    )
    const btn = screen.getByRole("button", { name: "강퇴" })
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute("title", "HOST 강퇴 불가")
  })

  it("non-HOST row: clicking opens dialog with crew label", async () => {
    const u = userEvent.setup()
    render(wrap(<CrewCard partyroomId={3} crews={[crew({})]} />))
    await u.click(screen.getByRole("button", { name: "강퇴" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText(/#14 dj-kim/)).toBeInTheDocument()
  })
})
