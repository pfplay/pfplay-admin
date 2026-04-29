import { http, HttpResponse } from "msw"
import {
  bodyListFixture,
  faceListFixture,
  bodyDraftFixture,
  faceDraftFixture,
  avatarNotFoundErrorFixture,
} from "../fixtures/avatars"

const API = "*/api/v1/admin/avatar"

export const avatarHandlers = [
  http.get(`${API}/bodies`, () => HttpResponse.json({ data: bodyListFixture })),
  http.get(`${API}/faces`, () => HttpResponse.json({ data: faceListFixture })),

  http.get(`${API}/bodies/:id`, ({ params }) => {
    if (params.id === "9999") {
      return HttpResponse.json(avatarNotFoundErrorFixture, { status: 404 })
    }
    return HttpResponse.json({ data: bodyDraftFixture })
  }),
  http.get(`${API}/faces/:id`, ({ params }) => {
    if (params.id === "9999") {
      return HttpResponse.json(avatarNotFoundErrorFixture, { status: 404 })
    }
    return HttpResponse.json({ data: faceDraftFixture })
  }),

  http.post(`${API}/bodies/:id/publish`, () => new HttpResponse(null, { status: 204 })),
  http.post(`${API}/bodies/:id/retire`, () => new HttpResponse(null, { status: 204 })),
  http.post(`${API}/faces/:id/publish`, () => new HttpResponse(null, { status: 204 })),
  http.post(`${API}/faces/:id/retire`, () => new HttpResponse(null, { status: 204 })),
]
