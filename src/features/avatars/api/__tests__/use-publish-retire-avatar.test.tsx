import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { toast } from "sonner"
import { usePublishAvatar } from "../use-publish-avatar"
import { useRetireAvatar } from "../use-retire-avatar"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

describe("usePublishAvatar", () => {
  afterEach(() => vi.restoreAllMocks())

  it("body publish: invalidate ['avatars','body'] + toast 'Body 게시 완료'", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    const successSpy = vi.spyOn(toast, "success").mockImplementation(() => "")

    const { result } = renderHook(() => usePublishAvatar("body"), { wrapper })
    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["avatars", "body"] })
    expect(successSpy).toHaveBeenCalledWith("Body 게시 완료")
  })

  it("face publish: invalidate ['avatars','face'] + toast 'Face 게시 완료'", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    const successSpy = vi.spyOn(toast, "success").mockImplementation(() => "")

    const { result } = renderHook(() => usePublishAvatar("face"), { wrapper })
    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["avatars", "face"] })
    expect(successSpy).toHaveBeenCalledWith("Face 게시 완료")
  })

  it("AVT-005 publish error → invalidate 미호출 + mutationErrorToast", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "")
    server.use(
      http.post("*/api/v1/admin/avatar/bodies/1/publish", () =>
        HttpResponse.json(
          { status: 409, errorCode: "AVT-005", message: "전이 불가" },
          { status: 409 },
        ),
      ),
    )

    const { result } = renderHook(() => usePublishAvatar("body"), { wrapper })
    result.current.mutate(1)
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalled()
  })
})

describe("useRetireAvatar", () => {
  afterEach(() => vi.restoreAllMocks())

  it("body retire: body shape + invalidate + toast 'Body 회수 완료'", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    const successSpy = vi.spyOn(toast, "success").mockImplementation(() => "")

    const { result } = renderHook(() => useRetireAvatar("body"), { wrapper })
    result.current.mutate({ id: 1, body: { reason: "abuse" } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["avatars", "body"] })
    expect(successSpy).toHaveBeenCalledWith("Body 회수 완료")
  })

  it("face retire: invalidate + toast 'Face 회수 완료'", async () => {
    const { wrapper } = makeWrapper()
    const successSpy = vi.spyOn(toast, "success").mockImplementation(() => "")

    const { result } = renderHook(() => useRetireAvatar("face"), { wrapper })
    result.current.mutate({ id: 1, body: { reason: "x" } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(successSpy).toHaveBeenCalledWith("Face 회수 완료")
  })

  it("AVT-005 retire error → invalidate 미호출 + mutationErrorToast", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "")
    server.use(
      http.post("*/api/v1/admin/avatar/bodies/1/retire", () =>
        HttpResponse.json(
          { status: 409, errorCode: "AVT-005", message: "전이 불가" },
          { status: 409 },
        ),
      ),
    )

    const { result } = renderHook(() => useRetireAvatar("body"), { wrapper })
    result.current.mutate({ id: 1, body: { reason: "x" } })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalled()
  })
})
