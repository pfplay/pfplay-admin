import { http, HttpResponse } from "msw"
import {
  administratorListFixture,
  administratorListIncludeRevokedFixture,
  createAdministratorResponseFixture,
  resetPasswordResponseFixture,
} from "../fixtures/administrators"

const API = "*/api/v1/admin/system/administrators"

export const administratorHandlers = [
  http.get(API, ({ request }) => {
    const url = new URL(request.url)
    const includeRevoked = url.searchParams.get("includeRevoked") === "true"
    const role = url.searchParams.get("role")
    const base = includeRevoked
      ? administratorListIncludeRevokedFixture
      : administratorListFixture
    const items = role
      ? base.items.filter((a) => a.role === role)
      : base.items
    return HttpResponse.json({
      data: { totalCount: items.length, items },
    })
  }),

  http.post(API, () => HttpResponse.json({ data: createAdministratorResponseFixture })),

  http.patch(`${API}/:id`, () => new HttpResponse(null, { status: 204 })),

  http.post(`${API}/:id/revoke`, () => new HttpResponse(null, { status: 204 })),

  http.post(`${API}/:id/reset-password`, () =>
    HttpResponse.json({ data: resetPasswordResponseFixture }),
  ),

  http.post(`${API}/:id/member-profile`, () =>
    HttpResponse.json({ data: { memberId: 199 } }),
  ),
]
