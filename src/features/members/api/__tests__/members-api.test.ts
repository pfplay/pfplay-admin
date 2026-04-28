import { describe, it, expect } from "vitest"
import { server } from "@/test/mocks/server"
import { http, HttpResponse } from "msw"
import { listMembers, getMemberDetail } from "../members-api"
import { memberSummaryFixture, memberDetailFixture } from "@/test/mocks/fixtures/members"

describe("members-api", () => {
  describe("listMembers", () => {
    it("ApiCommonResponse를 unwrap해서 Page<T>를 반환", async () => {
      const r = await listMembers({ page: 0, size: 50, sort: "created_at_desc" })
      expect(r.content[0].email).toEqual(memberSummaryFixture.email)
      expect(r.totalElements).toBeGreaterThanOrEqual(1)
    })

    it("filter를 query string으로 직렬화한다 (email/tier/joined_from/joined_to/sort/page/size)", async () => {
      let capturedUrl: URL | undefined
      server.use(
        http.get("*/api/v1/admin/members", ({ request }) => {
          capturedUrl = new URL(request.url)
          return HttpResponse.json({ data: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 50, first: true, last: true, empty: true, numberOfElements: 0 } })
        }),
      )
      await listMembers({
        email: "alice", tier: "AM",
        joined_from: "2026-01-01", joined_to: "2026-04-29",
        page: 2, size: 25, sort: "last_activity_desc",
      })
      const params = capturedUrl!.searchParams
      expect(params.get("email")).toBe("alice")
      expect(params.get("tier")).toBe("AM")
      expect(params.get("joined_from")).toBe("2026-01-01")
      expect(params.get("joined_to")).toBe("2026-04-29")
      expect(params.get("page")).toBe("2")
      expect(params.get("size")).toBe("25")
      expect(params.get("sort")).toBe("last_activity_desc")
    })

    it("undefined 필터는 query string에서 drop", async () => {
      let capturedUrl: URL | undefined
      server.use(
        http.get("*/api/v1/admin/members", ({ request }) => {
          capturedUrl = new URL(request.url)
          return HttpResponse.json({ data: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 50, first: true, last: true, empty: true, numberOfElements: 0 } })
        }),
      )
      await listMembers({ page: 0, size: 50, sort: "created_at_desc" })
      const params = capturedUrl!.searchParams
      expect(params.get("email")).toBeNull()
      expect(params.get("tier")).toBeNull()
    })
  })

  describe("getMemberDetail", () => {
    it("ApiCommonResponse를 unwrap한 detail을 반환", async () => {
      const r = await getMemberDetail(1)
      expect(r.memberId).toBe(memberDetailFixture.memberId)
    })

    it("404 → ApiError throw", async () => {
      await expect(getMemberDetail(9999)).rejects.toThrow()
    })
  })
})
