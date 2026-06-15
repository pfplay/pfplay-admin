import { describe, it, expect } from "vitest"
import { server } from "@/test/mocks/server"
import { http, HttpResponse } from "msw"
import { bulkApplyVirtualDj } from "../bulk-virtual-dj-api"
import { ApiError } from "@/shared/api/error"

describe("bulk-virtual-dj-api", () => {
  it("PUT /api/v1/admin/virtual-dj/bulk — body 그대로 전송 (204)", async () => {
    let methodSeen: string | undefined
    let bodySeen: unknown
    server.use(
      http.put(
        "*/api/v1/admin/virtual-dj/bulk",
        async ({ request }) => {
          methodSeen = request.method
          bodySeen = await request.json()
          return new HttpResponse(null, { status: 204 })
        },
      ),
    )

    await expect(
      bulkApplyVirtualDj({
        partyroomIds: [1, 2, 3],
        status: "MANAGED",
        targetCount: 8,
        companionFloor: 2,
        songPackId: 5,
      }),
    ).resolves.toBeUndefined()

    expect(methodSeen).toBe("PUT")
    expect(bodySeen).toEqual({
      partyroomIds: [1, 2, 3],
      status: "MANAGED",
      targetCount: 8,
      companionFloor: 2,
      songPackId: 5,
    })
  })

  it("OFF — target/floor/songPack null 전송", async () => {
    let bodySeen: unknown
    server.use(
      http.put("*/api/v1/admin/virtual-dj/bulk", async ({ request }) => {
        bodySeen = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await bulkApplyVirtualDj({
      partyroomIds: [10],
      status: "OFF",
      targetCount: null,
      companionFloor: null,
      songPackId: null,
    })

    expect(bodySeen).toEqual({
      partyroomIds: [10],
      status: "OFF",
      targetCount: null,
      companionFloor: null,
      songPackId: null,
    })
  })

  it("400 (검증 실패) → ApiError 전파", async () => {
    server.use(
      http.put("*/api/v1/admin/virtual-dj/bulk", () =>
        HttpResponse.json(
          {
            status: 400,
            errorCode: "VALIDATION_ERROR",
            message: "targetCount 필수",
          },
          { status: 400 },
        ),
      ),
    )

    await expect(
      bulkApplyVirtualDj({
        partyroomIds: [1],
        status: "MANAGED",
        targetCount: null,
        companionFloor: null,
        songPackId: null,
      }),
    ).rejects.toBeInstanceOf(ApiError)
  })
})
