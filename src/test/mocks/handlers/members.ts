import { http, HttpResponse } from "msw"
import { memberSummaryFixture, memberSummaryWithdrawnFixture, memberDetailFixture } from "../fixtures/members"

const API = "*/api/v1/admin/members"

export const memberHandlers = [
  // list happy path
  http.get(API, ({ request }) => {
    const url = new URL(request.url)
    const tier = url.searchParams.get("tier")
    const content = tier === "FM" ? [] : [memberSummaryFixture, memberSummaryWithdrawnFixture]
    return HttpResponse.json({
      data: {
        content,
        totalElements: content.length,
        totalPages: content.length === 0 ? 0 : 1,
        number: 0,
        size: 50,
        first: true,
        last: true,
        empty: content.length === 0,
        numberOfElements: content.length,
      },
    })
  }),

  // detail happy path
  http.get(`${API}/:memberId`, ({ params }) => {
    if (params.memberId === "9999") {
      return HttpResponse.json(
        { status: 404, errorCode: "MEMBER_NOT_FOUND", message: "존재하지 않는 회원" },
        { status: 404 },
      )
    }
    return HttpResponse.json({ data: memberDetailFixture })
  }),

  // mutation: tier 변경 (default happy path; per-test override는 server.use)
  http.patch(`${API}/:memberId/tier`, ({ params }) => {
    return HttpResponse.json({
      data: { memberId: Number(params.memberId), oldTier: "AM", newTier: "FM" },
    })
  }),

  // mutation: withdraw (idempotent default — alreadyWithdrawn=false)
  http.post(`${API}/:memberId/withdraw`, ({ params }) => {
    return HttpResponse.json({
      data: {
        memberId: Number(params.memberId),
        userAccountId: 100,
        withdrawnAt: "2026-04-29T10:00:00",
        alreadyWithdrawn: false,
      },
    })
  }),
]
