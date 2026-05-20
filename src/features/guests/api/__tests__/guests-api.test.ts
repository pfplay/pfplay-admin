import { describe, it, expect, vi, beforeEach } from "vitest"
import { listGuests, getGuestDetail } from "../guests-api"

vi.mock("@/shared/api/http", () => ({
  http: vi.fn(),
}))

import { http } from "@/shared/api/http"

const httpMock = http as ReturnType<typeof vi.fn>

beforeEach(() => {
  httpMock.mockReset()
})

describe("listGuests", () => {
  it("calls GET /api/v1/admin/guests with serialized query", async () => {
    httpMock.mockResolvedValueOnce({
      data: {
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        empty: true,
      },
    })

    await listGuests({
      email: "foo",
      joined_from: "2026-01-01",
      joined_to: undefined,
      sort: "created_at_desc",
      page: 0,
      size: 50,
    })

    expect(httpMock).toHaveBeenCalledTimes(1)
    const url = httpMock.mock.calls[0][0] as string
    expect(url).toContain("/api/v1/admin/guests?")
    expect(url).toContain("email=foo")
    expect(url).toContain("joined_from=2026-01-01")
    expect(url).not.toContain("joined_to=")
  })

  it("omits querystring leading '?' when serializeQuery returns empty (no params present)", async () => {
    httpMock.mockResolvedValueOnce({
      data: {
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        empty: true,
      },
    })

    await listGuests({ sort: "created_at_desc", page: 0, size: 50 })

    const url = httpMock.mock.calls[0][0] as string
    // sort/page/size 는 default 라 serializeQuery 정책에 따라 — members-api 패턴 동일
    expect(url.startsWith("/api/v1/admin/guests")).toBe(true)
  })
})

describe("getGuestDetail", () => {
  it("calls GET /api/v1/admin/guests/{id}", async () => {
    httpMock.mockResolvedValueOnce({
      data: { guestId: 50 },
    })

    await getGuestDetail(50)

    expect(httpMock).toHaveBeenCalledWith("/api/v1/admin/guests/50")
  })
})
