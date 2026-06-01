import { describe, it, expect } from "vitest"
import { server } from "@/test/mocks/server"
import { http, HttpResponse } from "msw"
import {
  getLiveStatus,
  applyConfig,
  drain,
  freeze,
} from "../virtual-dj-room-api"
import { ApiError } from "@/shared/api/error"

describe("virtual-dj-room-api", () => {
  it("GET /api/v1/admin/partyrooms/{id}/virtual-dj — live status 언랩", async () => {
    server.use(
      http.get("*/api/v1/admin/partyrooms/7/virtual-dj", () =>
        HttpResponse.json({
          data: {
            status: "MANAGED",
            targetCount: 8,
            companionFloor: 2,
            songPackId: 5,
            currentBotDjCount: 3,
          },
        }),
      ),
    )

    await expect(getLiveStatus(7)).resolves.toEqual({
      status: "MANAGED",
      targetCount: 8,
      companionFloor: 2,
      songPackId: 5,
      currentBotDjCount: 3,
    })
  })

  it("PUT /api/v1/admin/partyrooms/{id}/virtual-dj — body 그대로 전송 (204)", async () => {
    let methodSeen: string | undefined
    let bodySeen: unknown
    server.use(
      http.put(
        "*/api/v1/admin/partyrooms/7/virtual-dj",
        async ({ request }) => {
          methodSeen = request.method
          bodySeen = await request.json()
          return new HttpResponse(null, { status: 204 })
        },
      ),
    )

    await expect(
      applyConfig(7, {
        status: "MANAGED",
        targetCount: 8,
        companionFloor: 2,
        songPackId: 5,
      }),
    ).resolves.toBeUndefined()

    expect(methodSeen).toBe("PUT")
    expect(bodySeen).toEqual({
      status: "MANAGED",
      targetCount: 8,
      companionFloor: 2,
      songPackId: 5,
    })
  })

  it("POST /api/v1/admin/partyrooms/{id}/virtual-dj/drain (204)", async () => {
    let methodSeen: string | undefined
    server.use(
      http.post(
        "*/api/v1/admin/partyrooms/7/virtual-dj/drain",
        ({ request }) => {
          methodSeen = request.method
          return new HttpResponse(null, { status: 204 })
        },
      ),
    )

    await expect(drain(7)).resolves.toBeUndefined()
    expect(methodSeen).toBe("POST")
  })

  it("POST /api/v1/admin/partyrooms/{id}/virtual-dj/freeze (204)", async () => {
    let methodSeen: string | undefined
    server.use(
      http.post(
        "*/api/v1/admin/partyrooms/7/virtual-dj/freeze",
        ({ request }) => {
          methodSeen = request.method
          return new HttpResponse(null, { status: 204 })
        },
      ),
    )

    await expect(freeze(7)).resolves.toBeUndefined()
    expect(methodSeen).toBe("POST")
  })

  it("GET 4xx → ApiError 전파", async () => {
    server.use(
      http.get("*/api/v1/admin/partyrooms/7/virtual-dj", () =>
        HttpResponse.json(
          { status: 404, errorCode: "NOT_FOUND", message: "없음" },
          { status: 404 },
        ),
      ),
    )

    await expect(getLiveStatus(7)).rejects.toBeInstanceOf(ApiError)
  })
})
