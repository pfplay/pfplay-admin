import { describe, it, expect, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MembersPage } from "../members-page"

// Tabs 전환 로직만 좁게 검증 — widget 내부의 실 fetch 는 무시 (기존 members-page.test.tsx 가 실 MSW
// integration 으로 MEMBER 회귀 가드 담당)
vi.mock("@/widgets/members-list", () => ({
  MembersListWidget: () => <div data-testid="members-widget">MEMBER_WIDGET</div>,
}))
vi.mock("@/widgets/guests-list", () => ({
  GuestsListWidget: () => <div data-testid="guests-widget">GUEST_WIDGET</div>,
}))

function LocationProbe() {
  const loc = useLocation()
  return <div data-testid="loc-search">{loc.search}</div>
}

function renderWithRoute(initialPath: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/members"
            element={
              <>
                <MembersPage />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("MembersPage Tabs container", () => {
  it("defaults to MEMBER tab when no ?tab param", () => {
    renderWithRoute("/members")
    expect(screen.getByTestId("members-widget")).toBeInTheDocument()
    expect(screen.queryByTestId("guests-widget")).not.toBeInTheDocument()
  })

  it("renders GUEST tab when ?tab=guest (URL → active tab sync)", () => {
    renderWithRoute("/members?tab=guest")
    expect(screen.getByTestId("guests-widget")).toBeInTheDocument()
    expect(screen.queryByTestId("members-widget")).not.toBeInTheDocument()
  })

  it("renders MEMBER tab for invalid ?tab values (fallback to default)", () => {
    renderWithRoute("/members?tab=invalid_xyz")
    expect(screen.getByTestId("members-widget")).toBeInTheDocument()
    expect(screen.queryByTestId("guests-widget")).not.toBeInTheDocument()
  })

  it("clicking GUEST trigger updates URL to ?tab=guest AND swaps content (active tab → URL sync)", async () => {
    // Radix Tabs trigger 는 pointer event 기반 → fireEvent.click 미작동, userEvent 사용
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithRoute("/members")
    await user.click(screen.getByText("GUEST"))
    await waitFor(() =>
      expect(screen.getByTestId("loc-search").textContent).toContain(
        "tab=guest",
      ),
    )
    expect(screen.getByTestId("guests-widget")).toBeInTheDocument()
  })

  it("clicking MEMBER trigger from GUEST tab updates URL to ?tab=member", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    renderWithRoute("/members?tab=guest")
    await user.click(screen.getByText("정회원"))
    await waitFor(() =>
      expect(screen.getByTestId("loc-search").textContent).toContain(
        "tab=member",
      ),
    )
    expect(screen.getByTestId("members-widget")).toBeInTheDocument()
  })

  it("회귀 가드: MEMBER 탭 기본 렌더 (Member widget 호출됨)", () => {
    renderWithRoute("/members")
    expect(screen.getByTestId("members-widget")).toBeInTheDocument()
  })
})
