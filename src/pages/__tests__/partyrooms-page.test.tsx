import { describe, it, expect, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster, toast } from "sonner"
import { PartyroomsPage } from "../partyrooms-page"
import { partyroomListItemFixture } from "@/test/mocks/fixtures/partyrooms"

function wrap(initial = "/partyrooms") {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="/partyrooms" element={<PartyroomsPage />} />
          <Route
            path="/partyrooms/:partyroomId"
            element={<div data-testid="detail">detail</div>}
          />
        </Routes>
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("PartyroomsPage integration", () => {
  it("happy: 마운트 → list 로드 → 파티룸 row 노출", async () => {
    wrap()
    await waitFor(() =>
      expect(
        screen.getByText(partyroomListItemFixture.title),
      ).toBeInTheDocument(),
    )
  })

  it("URL `/partyrooms?sort=invalid_xyz` → zod 화이트리스트 차단 → invalid 필드 drop + toast → happy 복구", async () => {
    // PartyroomSortEnum (zod)이 invalid sort 차단 → stripInvalidParams + toast.
    // backend 400 path는 G5 unit test (api 레벨)에서 검증됨 — 여기선 zod 차단만.
    // sonner 포털 렌더는 jsdom 타이밍에 민감하므로 spy로 검증 (G3 교훈).
    const toastSpy = vi.spyOn(toast, "error")
    try {
      wrap("/partyrooms?sort=invalid_xyz")
      await waitFor(() =>
        expect(toastSpy).toHaveBeenCalledWith("필터 일부가 잘못돼 무시했어요"),
      )
      // sort drop 후 default ("createdAt,desc")로 재진입 → fixture row 보임 (recovery)
      await waitFor(() =>
        expect(
          screen.getByText(partyroomListItemFixture.title),
        ).toBeInTheDocument(),
      )
    } finally {
      toastSpy.mockRestore()
    }
  })
})
