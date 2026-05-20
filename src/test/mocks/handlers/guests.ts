import { http, HttpResponse } from "msw"
import {
  guestSummaryFixture,
  guestDetailFixture,
} from "../fixtures/guests"

const API = "*/api/v1/admin/guests"

export const guestHandlers = [
  // list happy path — 기본은 1건 응답 (필터 조합은 per-test override)
  http.get(API, () => {
    return HttpResponse.json({
      data: {
        content: [guestSummaryFixture],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 50,
        first: true,
        last: true,
        empty: false,
        numberOfElements: 1,
      },
    })
  }),

  // detail happy path — 9999 → 404 (member 패턴 동형)
  http.get(`${API}/:guestId`, ({ params }) => {
    if (params.guestId === "9999") {
      return HttpResponse.json(
        {
          status: 404,
          errorCode: "GUEST_NOT_FOUND",
          message: "존재하지 않는 게스트",
        },
        { status: 404 },
      )
    }
    return HttpResponse.json({ data: guestDetailFixture })
  }),
]
