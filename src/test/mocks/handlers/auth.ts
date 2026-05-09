import { http, HttpResponse } from "msw"
import { API_BASE_URL } from "../../../shared/config/env"

const VALID_EMAIL = "admin@pfplay.xyz"
const VALID_PASSWORD = "ValidPass!1"

export const authHandlers = [
  http.post(`${API_BASE_URL}/api/v1/auth/admin/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    if (body.email !== VALID_EMAIL || body.password !== VALID_PASSWORD) {
      return HttpResponse.json(
        { status: 401, errorCode: "AUTH-INVALID", message: "invalid credentials" },
        { status: 401 },
      )
    }
    return HttpResponse.json(
      {
        data: {
          tokenType: "Cookie",
          expiresIn: 900,
          issuedAt: "2026-04-28T10:00:00",
          role: "ADMIN",
          mustChangePassword: false,
        },
      },
      { status: 200 },
    )
  }),

  http.post(`${API_BASE_URL}/api/v1/auth/admin/logout`, () => new HttpResponse(null, { status: 204 })),

  http.post(`${API_BASE_URL}/api/v1/admin/password/change`, () => new HttpResponse(null, { status: 204 })),
]
