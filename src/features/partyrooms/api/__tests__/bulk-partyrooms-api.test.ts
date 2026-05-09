import { describe, it, expect } from "vitest"
import { server } from "@/test/mocks/server"
import { http, HttpResponse } from "msw"
import { bulkPartyroomAction } from "../bulk-partyrooms-api"
import { ApiError } from "@/shared/api/error"

describe("bulkPartyroomAction", () => {
  it("POST /admin/partyrooms/bulk-action with body, 200 response unwrap", async () => {
    let bodySeen: unknown
    server.use(
      http.post("*/api/v1/admin/partyrooms/bulk-action", async ({ request }) => {
        bodySeen = await request.json()
        return HttpResponse.json({
          results: [
            { partyroomId: 1, success: true, error: null },
            { partyroomId: 2, success: true, error: null },
          ],
        })
      }),
    )
    const r = await bulkPartyroomAction({
      partyroomIds: [1, 2],
      action: "TERMINATE",
      reason: "abuse",
      skipErrors: true,
    })
    expect(bodySeen).toEqual({
      partyroomIds: [1, 2],
      action: "TERMINATE",
      reason: "abuse",
      skipErrors: true,
    })
    expect(r.results).toHaveLength(2)
    expect(r.results.every((row) => row.success)).toBe(true)
  })

  it("partial failure 200 — results에 success=false 포함", async () => {
    server.use(
      http.post("*/api/v1/admin/partyrooms/bulk-action", () =>
        HttpResponse.json({
          results: [
            { partyroomId: 1, success: true, error: null },
            { partyroomId: 2, success: false, error: "이미 종료된 파티룸입니다" },
          ],
        }),
      ),
    )
    const r = await bulkPartyroomAction({
      partyroomIds: [1, 2],
      action: "TERMINATE",
      reason: "abuse",
    })
    expect(r.results[1]).toMatchObject({ success: false, error: expect.any(String) })
  })

  it("400 (validation) → ApiError 전파", async () => {
    server.use(
      http.post("*/api/v1/admin/partyrooms/bulk-action", () =>
        HttpResponse.json(
          { status: 400, errorCode: "VALIDATION", message: "잘못된 요청" },
          { status: 400 },
        ),
      ),
    )
    await expect(
      bulkPartyroomAction({
        partyroomIds: [1],
        action: "TERMINATE",
        reason: "x",
      }),
    ).rejects.toBeInstanceOf(ApiError)
  })
})
