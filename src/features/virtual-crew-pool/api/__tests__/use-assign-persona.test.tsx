import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { useAssignPersona, useUnassignPersona } from "../use-assign-persona"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

describe("useAssignPersona", () => {
  afterEach(() => vi.restoreAllMocks())

  it("assign 성공 시 bots 쿼리를 invalidate 한다", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    server.use(
      http.post("*/api/v1/admin/virtual-crew/bots/persona/assign", () =>
        HttpResponse.json({ data: { applied: 2 } }, { status: 200 }),
      ),
    )

    const { result } = renderHook(() => useAssignPersona(), { wrapper })
    result.current.mutate({ botIds: [1, 2], personaId: 5 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["virtual-crew", "bots"],
    })
  })

  it("assign 실패 시 invalidate 하지 않는다", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    server.use(
      http.post("*/api/v1/admin/virtual-crew/bots/persona/assign", () =>
        HttpResponse.json(
          { status: 400, errorCode: null, message: "bad" },
          { status: 400 },
        ),
      ),
    )

    const { result } = renderHook(() => useAssignPersona(), { wrapper })
    result.current.mutate({ botIds: [1, 2], personaId: 5 })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})

describe("useUnassignPersona", () => {
  afterEach(() => vi.restoreAllMocks())

  it("unassign 성공 시 bots 쿼리를 invalidate 한다", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    server.use(
      http.post("*/api/v1/admin/virtual-crew/bots/persona/unassign", () =>
        HttpResponse.json({ data: { applied: 2 } }, { status: 200 }),
      ),
    )

    const { result } = renderHook(() => useUnassignPersona(), { wrapper })
    result.current.mutate([1, 2])
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["virtual-crew", "bots"],
    })
  })

  it("unassign 실패 시 invalidate 하지 않는다", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    server.use(
      http.post("*/api/v1/admin/virtual-crew/bots/persona/unassign", () =>
        HttpResponse.json(
          { status: 500, errorCode: null, message: "boom" },
          { status: 500 },
        ),
      ),
    )

    const { result } = renderHook(() => useUnassignPersona(), { wrapper })
    result.current.mutate([1, 2])
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
