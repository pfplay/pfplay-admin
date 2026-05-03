import { describe, expect, it, vi, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MembersDetailWidget } from "../members-detail"

function renderAt(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/members/:memberId" element={<MembersDetailWidget />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("MembersDetailWidget", () => {
  afterEach(() => vi.restoreAllMocks())

  it("renders MembersActionsDropdown in header after detail loads", async () => {
    renderAt("/members/1")
    await waitFor(() =>
      expect(screen.getByRole("button", { name: '작업' })).toBeInTheDocument(),
    )
  })
})
