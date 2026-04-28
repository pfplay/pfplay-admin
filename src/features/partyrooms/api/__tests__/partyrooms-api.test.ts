import { describe, it, expect } from "vitest"
import { server } from "@/test/mocks/server"
import { http, HttpResponse } from "msw"
import { listPartyrooms, getPartyroomDetail } from "../partyrooms-api"
import { partyroomListItemFixture } from "@/test/mocks/fixtures/partyrooms"
import { ApiError } from "@/shared/api/error"

describe("partyrooms-api", () => {
  describe("listPartyrooms", () => {
    it("raw Page<T> 반환 (unwrap 안 함 — backend wrap 비대칭)", async () => {
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
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: 0,
            size: 50,
            first: true,
            last: true,
            empty: true,
            numberOfElements: 0,
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
    it("raw detail 반환 (unwrap 안 함)", async () => {
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
})
