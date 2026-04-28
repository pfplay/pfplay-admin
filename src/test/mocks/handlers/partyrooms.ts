import { http, HttpResponse } from "msw"
import { partyroomListItemFixture, partyroomDetailFixture } from "../fixtures/partyrooms"

const API = "*/api/v1/admin/partyrooms"

export const partyroomHandlers = [
  http.get(API, () => {
    // backend 400 (sort whitelist 위반) 분기는 zod (PartyroomSortEnum)에서 미리 차단되어 dead code — 추가 안 함.
    // backend 400 propagation 검증은 G5 Task 5.2 unit test (api 레벨 type-cast invalid sort)로 처리.
    const content = [partyroomListItemFixture]
    return HttpResponse.json({
      content,
      totalElements: content.length,
      totalPages: 1,
      number: 0,
      size: 50,
      first: true,
      last: true,
      empty: false,
      numberOfElements: content.length,
    })
  }),

  http.get(`${API}/:partyroomId`, ({ params }) => {
    if (params.partyroomId === "9999") {
      return HttpResponse.json(
        { status: 404, errorCode: "NOT_FOUND_ROOM", message: "존재하지 않는 룸" },
        { status: 404 },
      )
    }
    return HttpResponse.json(partyroomDetailFixture)
  }),
]
