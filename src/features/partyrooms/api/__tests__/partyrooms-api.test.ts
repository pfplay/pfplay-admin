import { describe, it, expect } from "vitest"
import { server } from "@/test/mocks/server"
import { http, HttpResponse } from "msw"
import {
  listPartyrooms,
  getPartyroomDetail,
  terminatePartyroom,
  suspendPartyroom,
  restorePartyroom,
  updatePartyroomMeta,
  updatePartyroomDisplayFlag,
} from "../partyrooms-api"
import { partyroomListItemFixture } from "@/test/mocks/fixtures/partyrooms"
import { ApiError } from "@/shared/api/error"

describe("partyrooms-api", () => {
  describe("listPartyrooms", () => {
    it("ApiCommonResponse<Page<T>> unwrap 후 Page 반환", async () => {
      const r = await listPartyrooms({ page: 0, size: 50, sort: "createdAt,desc" })
      expect(r.content[0].partyroomId).toBe(partyroomListItemFixture.partyroomId)
      expect(r.totalElements).toBeGreaterThanOrEqual(1)
    })

    it("filter/sort 직렬화 — status/stageType/createdFrom/createdTo/host/page/size/sort", async () => {
      let capturedUrl: URL | undefined
      server.use(
        http.get("*/api/v1/admin/partyrooms", ({ request }) => {
          capturedUrl = new URL(request.url)
          return HttpResponse.json({
            data: {
              content: [],
              totalElements: 0,
              totalPages: 0,
              number: 0,
              size: 50,
              first: true,
              last: true,
              empty: true,
              numberOfElements: 0,
            },
          })
        }),
      )
      await listPartyrooms({
        status: "ACTIVE",
        stageType: "GENERAL",
        host: "alice",
        createdFrom: "2026-01-01T00:00:00.000Z",
        createdTo: "2026-04-29T00:00:00.000Z",
        page: 1,
        size: 25,
        sort: "hostNickname,asc",
      })
      const p = capturedUrl!.searchParams
      expect(p.get("status")).toBe("ACTIVE")
      expect(p.get("stageType")).toBe("GENERAL")
      expect(p.get("host")).toBe("alice")
      expect(p.get("createdFrom")).toBe("2026-01-01T00:00:00.000Z")
      expect(p.get("createdTo")).toBe("2026-04-29T00:00:00.000Z")
      expect(p.get("page")).toBe("1")
      expect(p.get("size")).toBe("25")
      expect(p.get("sort")).toBe("hostNickname,asc")
    })

    it("invalid sort → 400 ApiError 전파", async () => {
      server.use(
        http.get("*/api/v1/admin/partyrooms", () =>
          HttpResponse.json(
            { status: 400, errorCode: "ADM-PR-001", message: "허용되지 않은 정렬 키" },
            { status: 400 },
          ),
        ),
      )
      await expect(
        listPartyrooms({ page: 0, size: 50, sort: "invalid_xyz" as never }),
      ).rejects.toMatchObject({ status: 400, errorCode: "ADM-PR-001" })
      await expect(
        listPartyrooms({ page: 0, size: 50, sort: "invalid_xyz" as never }),
      ).rejects.toBeInstanceOf(ApiError)
    })
  })

  describe("getPartyroomDetail", () => {
    it("ApiCommonResponse<Detail> unwrap 후 detail 반환", async () => {
      const r = await getPartyroomDetail(1)
      expect(r.title).toBeTruthy()
      expect(r.partyroomId).toBe(1)
    })

    it("404 → ApiError throw", async () => {
      await expect(getPartyroomDetail(9999)).rejects.toMatchObject({
        status: 404,
        errorCode: "NOT_FOUND_ROOM",
      })
      await expect(getPartyroomDetail(9999)).rejects.toBeInstanceOf(ApiError)
    })
  })

  describe("terminatePartyroom", () => {
    it("POST /admin/partyrooms/:id/terminate with body, 204", async () => {
      let bodySeen: unknown
      server.use(
        http.post("*/api/v1/admin/partyrooms/1/terminate", async ({ request }) => {
          bodySeen = await request.json()
          return new HttpResponse(null, { status: 204 })
        }),
      )
      await terminatePartyroom(1, { reason: "abuse" })
      expect(bodySeen).toEqual({ reason: "abuse" })
    })

    it("propagates ApiError on 403 ALREADY_TERMINATED", async () => {
      server.use(
        http.post("*/api/v1/admin/partyrooms/1/terminate", () =>
          HttpResponse.json(
            { status: 403, errorCode: "ALREADY_TERMINATED", message: "이미 종료" },
            { status: 403 },
          ),
        ),
      )
      await expect(terminatePartyroom(1, { reason: "x" })).rejects.toMatchObject({
        status: 403,
        errorCode: "ALREADY_TERMINATED",
      })
    })
  })

  describe("suspendPartyroom / restorePartyroom", () => {
    it("suspend 204", async () => {
      server.use(
        http.post("*/api/v1/admin/partyrooms/1/suspend", () => new HttpResponse(null, { status: 204 })),
      )
      await expect(suspendPartyroom(1, { reason: "x" })).resolves.toBeUndefined()
    })

    it("restore 204 with no body", async () => {
      let bodySeen = "presence-marker"
      server.use(
        http.post("*/api/v1/admin/partyrooms/1/restore", async ({ request }) => {
          bodySeen = await request.text()
          return new HttpResponse(null, { status: 204 })
        }),
      )
      await restorePartyroom(1)
      expect(bodySeen).toBe("")
    })

    it("suspend propagates 409 ILLEGAL_STATE_TRANSITION", async () => {
      server.use(
        http.post("*/api/v1/admin/partyrooms/1/suspend", () =>
          HttpResponse.json(
            { status: 409, errorCode: "ILLEGAL_STATE_TRANSITION", message: "전이 불가" },
            { status: 409 },
          ),
        ),
      )
      await expect(suspendPartyroom(1, { reason: "x" })).rejects.toMatchObject({
        status: 409,
        errorCode: "ILLEGAL_STATE_TRANSITION",
      })
    })
  })

  describe("updatePartyroomMeta", () => {
    it("PATCH /admin/partyrooms/:id with body, 204", async () => {
      let bodySeen: unknown
      server.use(
        http.patch("*/api/v1/admin/partyrooms/1", async ({ request }) => {
          bodySeen = await request.json()
          return new HttpResponse(null, { status: 204 })
        }),
      )
      await updatePartyroomMeta(1, { title: "new title", playbackTimeLimit: 30 })
      expect(bodySeen).toEqual({ title: "new title", playbackTimeLimit: 30 })
    })
  })

  describe("updatePartyroomDisplayFlag", () => {
    it("PATCH /admin/partyrooms/:id/display-flag with body, 204", async () => {
      let bodySeen: unknown
      server.use(
        http.patch("*/api/v1/admin/partyrooms/1/display-flag", async ({ request }) => {
          bodySeen = await request.json()
          return new HttpResponse(null, { status: 204 })
        }),
      )
      await updatePartyroomDisplayFlag(1, { flag: "FEATURED" })
      expect(bodySeen).toEqual({ flag: "FEATURED" })
    })
  })
})
