import { describe, it, expect } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PartyroomDetailPage } from "../partyroom-detail-page"
import { partyroomDetailFixture } from "@/test/mocks/fixtures/partyrooms"

function wrap(initial: string) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route
            path="/partyrooms/:partyroomId"
            element={<PartyroomDetailPage />}
          />
          <Route path="/partyrooms" element={<div data-testid="list">list</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("PartyroomDetailPage integration (G7)", () => {
  it("happy: /partyrooms/1 → 5 카드 노출", async () => {
    wrap("/partyrooms/1")
    await waitFor(() =>
      expect(
        screen.getByText(
          `#${partyroomDetailFixture.partyroomId} ${partyroomDetailFixture.title}`,
        ),
      ).toBeInTheDocument(),
    )
  })

  it("404: /partyrooms/9999 → '존재하지 않는 파티룸' + 목록으로 버튼", async () => {
    wrap("/partyrooms/9999")
    await waitFor(() =>
      expect(screen.getByText(/존재하지 않는 파티룸/)).toBeInTheDocument(),
    )
    const backLink = screen.getByRole("link", { name: "목록으로" })
    expect(backLink).toHaveAttribute("href", "/partyrooms")
  })
})
