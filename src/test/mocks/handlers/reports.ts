import { http, HttpResponse } from "msw"
import {
  reportListPageFixture,
  reportDetailFixture,
  reportNotFoundErrorFixture,
} from "../fixtures/reports"

const API = "*/api/v1/admin/reports"

export const reportHandlers = [
  http.get(API, () => HttpResponse.json({ data: reportListPageFixture })),

  http.get(`${API}/:reportId`, ({ params }) => {
    if (params.reportId === "9999") {
      return HttpResponse.json(reportNotFoundErrorFixture, { status: 404 })
    }
    return HttpResponse.json({ data: reportDetailFixture })
  }),

  // 14e PATCH default — input target status 반영해 detail 응답
  http.patch(`${API}/:reportId`, async ({ request }) => {
    const body = (await request.json()) as { status: string; resolutionNote?: string | null }
    const updated = {
      ...reportDetailFixture,
      status: body.status as typeof reportDetailFixture.status,
      review: {
        reviewedByAdministratorId: 99,
        resolutionNote: body.resolutionNote ?? null,
        resolvedAt:
          body.status === "RESOLVED" || body.status === "DISMISSED"
            ? "2026-04-29T13:00:00"
            : null,
      },
    }
    return HttpResponse.json({ data: updated })
  }),
]
