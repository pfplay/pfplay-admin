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

// TSID(2^53 초과) — 문자열로 왕복하지 않으면 JS number 정밀도가 손실되는 실제 규모의 id.
const BOT_A = "864530440482800637"
const BOT_B = "864530440482800638"
const BOT_C = "864530440482800639"

describe("bots-api", () => {
  it("getBots — GET 로스터 unwrap (userId 문자열 유지)", async () => {
    server.use(
      http.get("*/api/v1/admin/virtual-crew/bots", () =>
        HttpResponse.json({
          data: [
            {
              userId: BOT_A,
              nickname: "봇하나",
              avatarBodyUri: "https://cdn/body_001.png",
              avatarIconUri: "https://cdn/icon_001.png",
              placementRoomId: 5,
              placementRoomTitle: "메인",
            },
            {
              userId: BOT_B,
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
      userId: BOT_A,
      nickname: "봇하나",
      avatarBodyUri: "https://cdn/body_001.png",
      avatarIconUri: "https://cdn/icon_001.png",
      placementRoomId: 5,
      placementRoomTitle: "메인",
    })
    expect(r[1].placementRoomId).toBeNull()
  })

  it("setBotAvatar — PUT {userId}/avatar body {avatarBodyUri}, 204 (대형 TSID URL 무손실)", async () => {
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
      setBotAvatar(BOT_A, "https://cdn/body_003.png"),
    ).resolves.toBeUndefined()
    expect(urlSeen).toBe(BOT_A)
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
                { userId: BOT_A, avatarBodyUri: "https://cdn/body_001.png" },
                { userId: BOT_B, avatarBodyUri: "https://cdn/body_002.png" },
              ],
            },
          })
        },
      ),
    )
    const r = await distributeAvatars(
      [BOT_A, BOT_B],
      ["https://cdn/body_001.png", "https://cdn/body_002.png"],
    )
    expect(bodySeen).toEqual({
      botIds: [BOT_A, BOT_B],
      bodyUris: ["https://cdn/body_001.png", "https://cdn/body_002.png"],
    })
    expect(r.assigned).toHaveLength(2)
    expect(r.assigned[0]).toEqual({
      userId: BOT_A,
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
    const r = await assignPersona([BOT_A, BOT_B], 7)
    expect(bodySeen).toEqual({ botIds: [BOT_A, BOT_B], personaId: 7 })
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
    const r = await unassignPersona([BOT_A, BOT_B, BOT_C])
    expect(bodySeen).toEqual({ botIds: [BOT_A, BOT_B, BOT_C] })
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
    await expect(assignPersona([BOT_A], 999)).rejects.toBeInstanceOf(ApiError)
  })
})
