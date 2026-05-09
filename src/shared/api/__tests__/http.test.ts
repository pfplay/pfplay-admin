// src/shared/api/__tests__/http.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { http as msw, HttpResponse } from "msw"
import { server } from "../../../test/mocks/server"
import { http } from "../http"
import { ApiError } from "../error"
import { API_BASE_URL } from "../../config/env"
import { useSessionStore } from "../../../entities/session/model/store"

const BASE_META = {
  role: "ADMIN" as const,
  mustChangePassword: false,
  issuedAt: "2026-04-28T10:00:00.000Z",
  expiresAt: "2026-04-28T10:15:00.000Z",
}

describe("shared/api/http.ts", () => {
  let originalLocation: Location
  beforeEach(() => {
    originalLocation = window.location
    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: "", assign: vi.fn() } as unknown as Location,
    })
    document.cookie = "XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    useSessionStore.getState().clear()
  })
  afterEach(() => {
    Object.defineProperty(window, "location", { writable: true, value: originalLocation })
  })

  it("401 응답 시 store.clear() + window.location.href = /login + ApiError throw", async () => {
    server.use(
      msw.get(`${API_BASE_URL}/api/v1/probe`, () =>
        HttpResponse.json({ status: 401, errorCode: "AUTH-EXPIRED", message: "expired" }, { status: 401 }),
      ),
    )
    useSessionStore.getState().setSession(BASE_META)

    await expect(http("/api/v1/probe")).rejects.toBeInstanceOf(ApiError)
    expect(useSessionStore.getState().isAuthenticated).toBe(false)
    expect(window.location.href).toBe("/login")
  })

  it("skip401Redirect: true 옵션 시 인터셉터 우회 — store 유지 + ApiError throw", async () => {
    server.use(
      msw.post(`${API_BASE_URL}/api/v1/auth/admin/login`, () =>
        HttpResponse.json({ status: 401, errorCode: "AUTH-INVALID", message: "invalid" }, { status: 401 }),
      ),
    )
    useSessionStore.getState().setSession(BASE_META)

    await expect(
      http("/api/v1/auth/admin/login", { method: "POST", body: { email: "x", password: "y" }, skip401Redirect: true }),
    ).rejects.toBeInstanceOf(ApiError)
    expect(useSessionStore.getState().isAuthenticated).toBe(true)
    expect(window.location.href).toBe("")
  })

  it("XSRF-TOKEN 쿠키 존재 시 변형 요청에 X-XSRF-TOKEN 헤더 echo", async () => {
    document.cookie = "XSRF-TOKEN=csrf-abc; path=/;"
    let receivedHeader: string | null = null
    server.use(
      msw.post(`${API_BASE_URL}/api/v1/admin/probe`, ({ request }) => {
        receivedHeader = request.headers.get("X-XSRF-TOKEN")
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await http("/api/v1/admin/probe", { method: "POST", body: {} })
    expect(receivedHeader).toBe("csrf-abc")
  })
})
