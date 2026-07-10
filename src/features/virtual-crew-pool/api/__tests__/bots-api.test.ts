import { describe, it, expect } from "vitest"
import { server } from "@/test/mocks/server"
import { http, HttpResponse } from "msw"
import {
  getBots,
  setBotAvatar,
  distributeAvatars,
  assignPersona,
  unassignPersona,
} from "../bots-api"
import { ApiError } from "@/shared/api/error"

describe("bots-api", () => {
  it("getBots — GET 로스터 unwrap", async () => {
    server.use(
      http.get("*/api/v1/admin/virtual-crew/bots", () =>
        HttpResponse.json({
          data: [
            {
              userId: 101,
              nickname: "봇하나",
              avatarBodyUri: "https://cdn/body_001.png",
              avatarIconUri: "https://cdn/icon_001.png",
              placementRoomId: 5,
              placementRoomTitle: "메인",
            },
            {
              userId: 102,
              nickname: "봇둘",
              avatarBodyUri: "https://cdn/body_002.png",
              avatarIconUri: "https://cdn/icon_002.png",
              placementRoomId: null,
              placementRoomTitle: null,
            },
          ],
        }),
      ),
    )
    const r = await getBots()
    expect(r).toHaveLength(2)
    expect(r[0]).toEqual({
      userId: 101,
      nickname: "봇하나",
      avatarBodyUri: "https://cdn/body_001.png",
      avatarIconUri: "https://cdn/icon_001.png",
      placementRoomId: 5,
      placementRoomTitle: "메인",
    })
    expect(r[1].placementRoomId).toBeNull()
  })

  it("setBotAvatar — PUT {userId}/avatar body {avatarBodyUri}, 204", async () => {
    let urlSeen = ""
    let bodySeen: unknown
    server.use(
      http.put(
        "*/api/v1/admin/virtual-crew/bots/:userId/avatar",
        async ({ request, params }) => {
          urlSeen = String(params.userId)
          bodySeen = await request.json()
          return new HttpResponse(null, { status: 204 })
        },
      ),
    )
    await expect(
      setBotAvatar(101, "https://cdn/body_003.png"),
    ).resolves.toBeUndefined()
    expect(urlSeen).toBe("101")
    expect(bodySeen).toEqual({ avatarBodyUri: "https://cdn/body_003.png" })
  })

  it("distributeAvatars — POST body {botIds, bodyUris} unwrap", async () => {
    let bodySeen: unknown
    server.use(
      http.post(
        "*/api/v1/admin/virtual-crew/bots/avatar/distribute",
        async ({ request }) => {
          bodySeen = await request.json()
          return HttpResponse.json({
            data: {
              assigned: [
                { userId: 101, avatarBodyUri: "https://cdn/body_001.png" },
                { userId: 102, avatarBodyUri: "https://cdn/body_002.png" },
              ],
            },
          })
        },
      ),
    )
    const r = await distributeAvatars(
      [101, 102],
      ["https://cdn/body_001.png", "https://cdn/body_002.png"],
    )
    expect(bodySeen).toEqual({
      botIds: [101, 102],
      bodyUris: ["https://cdn/body_001.png", "https://cdn/body_002.png"],
    })
    expect(r.assigned).toHaveLength(2)
    expect(r.assigned[0]).toEqual({
      userId: 101,
      avatarBodyUri: "https://cdn/body_001.png",
    })
  })

  it("distributeAvatars — 서버 에러 시 ApiError 전파", async () => {
    server.use(
      http.post("*/api/v1/admin/virtual-crew/bots/avatar/distribute", () =>
        HttpResponse.json(
          { status: 400, errorCode: "VDJ-008", message: "invalid set" },
          { status: 400 },
        ),
      ),
    )
    await expect(distributeAvatars([], ["x"])).rejects.toBeInstanceOf(ApiError)
  })

  it("assignPersona — POST body {botIds, personaId} unwrap applied", async () => {
    let bodySeen: unknown
    server.use(
      http.post(
        "*/api/v1/admin/virtual-crew/bots/persona/assign",
        async ({ request }) => {
          bodySeen = await request.json()
          return HttpResponse.json({ data: { applied: 2 } })
        },
      ),
    )
    const r = await assignPersona([101, 102], 7)
    expect(bodySeen).toEqual({ botIds: [101, 102], personaId: 7 })
    expect(r.applied).toBe(2)
  })

  it("unassignPersona — POST body {botIds} unwrap applied", async () => {
    let bodySeen: unknown
    server.use(
      http.post(
        "*/api/v1/admin/virtual-crew/bots/persona/unassign",
        async ({ request }) => {
          bodySeen = await request.json()
          return HttpResponse.json({ data: { applied: 3 } })
        },
      ),
    )
    const r = await unassignPersona([101, 102, 103])
    expect(bodySeen).toEqual({ botIds: [101, 102, 103] })
    expect(r.applied).toBe(3)
  })

  it("assignPersona — 서버 에러 시 ApiError 전파", async () => {
    server.use(
      http.post("*/api/v1/admin/virtual-crew/bots/persona/assign", () =>
        HttpResponse.json(
          { status: 400, errorCode: "VDJ-020", message: "no persona" },
          { status: 400 },
        ),
      ),
    )
    await expect(assignPersona([101], 999)).rejects.toBeInstanceOf(ApiError)
  })
})
