import { http, HttpResponse } from "msw"
import {
  announcementListFixture,
  createAnnouncementResponseFixture,
} from "../fixtures/announcements"

const API = "*/api/v1/admin/announcements"

export const announcementHandlers = [
  http.post(API, () =>
    HttpResponse.json({ data: createAnnouncementResponseFixture }),
  ),

  http.get(API, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get("page") ?? "0")
    const size = Number(url.searchParams.get("size") ?? "20")
    const all = announcementListFixture.content
    const start = page * size
    const slice = all.slice(start, start + size)
    return HttpResponse.json({
      data: {
        content: slice,
        totalElements: all.length,
        totalPages: Math.max(1, Math.ceil(all.length / size)),
        number: page,
        size,
      },
    })
  }),

  http.delete(`${API}/:id`, () => HttpResponse.json({ data: null })),

  http.patch(`${API}/:id/schedule`, () => HttpResponse.json({ data: null })),
  http.post(`${API}/:id/complete`, () => HttpResponse.json({ data: null })),
]
