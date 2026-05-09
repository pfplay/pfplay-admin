import { describe, it, expect } from "vitest"
import { server } from "@/test/mocks/server"
import { http, HttpResponse } from "msw"
import {
  listReports,
  getReportDetail,
  updateReportStatus,
} from "../reports-api"
import { ApiError } from "@/shared/api/error"

describe("reports-api", () => {
  describe("listReports", () => {
    it("기본 fetch + ApiCommonResponse unwrap → Page<T>", async () => {
      const r = await listReports({
        page: 0,
        size: 50,
        sort: "created_at_desc",
      })
      expect(r.content).toHaveLength(5)
      expect(r.totalElements).toBe(5)
    })

    it("multi status[] / category[] 직렬화 (URLSearchParams.append)", async () => {
      let captured: URL | undefined
      server.use(
        http.get("*/api/v1/admin/reports", ({ request }) => {
          captured = new URL(request.url)
          return HttpResponse.json({
            data: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 50, first: true, last: true, empty: true, numberOfElements: 0 },
          })
        }),
      )
      await listReports({
        status: ["PENDING", "REVIEWING"],
        category: ["INAPPROPRIATE_CONTENT", "SPAM"],
        createdFrom: "2026-01-01",
        createdTo: "2026-04-29",
        page: 1,
        size: 25,
        sort: "created_at_asc",
      })
      const params = captured!.searchParams
      expect(params.getAll("status")).toEqual(["PENDING", "REVIEWING"])
      expect(params.getAll("category")).toEqual(["INAPPROPRIATE_CONTENT", "SPAM"])
      expect(params.get("created_from")).toBe("2026-01-01")
      expect(params.get("created_to")).toBe("2026-04-29")
      expect(params.get("page")).toBe("1")
      expect(params.get("size")).toBe("25")
      expect(params.get("sort")).toBe("created_at_asc")
    })

    it("400 RPT-004 → ApiError 전파", async () => {
      server.use(
        http.get("*/api/v1/admin/reports", () =>
          HttpResponse.json(
            { status: 400, errorCode: "RPT-004", message: "기간 invalid" },
            { status: 400 },
          ),
        ),
      )
      await expect(
        listReports({ page: 0, size: 50, sort: "created_at_desc" }),
      ).rejects.toMatchObject({ status: 400, errorCode: "RPT-004" })
    })
  })

  describe("getReportDetail", () => {
    it("detail unwrap", async () => {
      const r = await getReportDetail(1)
      expect(r.reportId).toBe(1)
      expect(r.reporter.email).toBe("reporter@example.com")
    })

    it("404 RPT-001 → ApiError throw", async () => {
      await expect(getReportDetail(9999)).rejects.toMatchObject({
        status: 404,
        errorCode: "RPT-001",
      })
      await expect(getReportDetail(9999)).rejects.toBeInstanceOf(ApiError)
    })
  })

  describe("updateReportStatus", () => {
    it("PATCH body shape + detail 응답 unwrap", async () => {
      let bodySeen: unknown
      server.use(
        http.patch("*/api/v1/admin/reports/1", async ({ request }) => {
          bodySeen = await request.json()
          return HttpResponse.json({
            data: {
              reportId: 1, status: "RESOLVED", category: "INAPPROPRIATE_CONTENT",
              description: "x", reporter: { userAccountId: 5, email: "r@e.com", nickname: "r" },
              partyroom: { partyroomId: 100, title: "p", host: { userAccountId: 200, nickname: "h" } },
              review: { reviewedByAdministratorId: 99, resolutionNote: "ok", resolvedAt: "2026-04-29T13:00:00" },
              createdAt: "2026-04-28T10:00:00",
            },
          })
        }),
      )
      const r = await updateReportStatus(1, { status: "RESOLVED", resolutionNote: "ok" })
      expect(bodySeen).toEqual({ status: "RESOLVED", resolutionNote: "ok" })
      expect(r.status).toBe("RESOLVED")
      expect(r.review.resolutionNote).toBe("ok")
    })

    it("400 RPT-002 → ApiError 전파", async () => {
      server.use(
        http.patch("*/api/v1/admin/reports/1", () =>
          HttpResponse.json(
            { status: 400, errorCode: "RPT-002", message: "전이 불가" },
            { status: 400 },
          ),
        ),
      )
      await expect(
        updateReportStatus(1, { status: "RESOLVED", resolutionNote: "x" }),
      ).rejects.toMatchObject({ status: 400, errorCode: "RPT-002" })
    })
  })
})
