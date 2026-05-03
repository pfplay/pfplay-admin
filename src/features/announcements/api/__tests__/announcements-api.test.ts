import { describe, it, expect } from "vitest"
import { server } from "@/test/mocks/server"
import { http, HttpResponse } from "msw"
import {
  createAnnouncement,
  listAnnouncements,
  cancelAnnouncement,
} from "../announcements-api"
import { ApiError } from "@/shared/api/error"
import {
  annNotFoundError,
  annAlreadyCancelledError,
  annInvalidScheduleForTypeError,
  annInvalidScheduleWindowError,
  annScheduledStartInPastError,
} from "@/test/mocks/fixtures/announcements"
import type { CreateAnnouncementRequest } from "../../model/mutation-schema"

describe("announcements-api", () => {
  it("createAnnouncement — body 전송 + announcementId 응답 unwrap", async () => {
    let bodySeen: unknown
    server.use(
      http.post("*/api/v1/admin/announcements", async ({ request }) => {
        bodySeen = await request.json()
        return HttpResponse.json({ data: { announcementId: 42 } })
      }),
    )
    const body: CreateAnnouncementRequest = {
      type: "MAINTENANCE_NOTICE",
      severity: "WARN",
      titleKo: "ko",
      titleEn: "en",
      messageKo: "kobody",
      messageEn: "enbody",
      scheduledStartAt: "2099-01-01T00:00:00",
      scheduledEndAt: "2099-01-01T01:00:00",
      expiresAt: null,
    }
    const r = await createAnnouncement(body)
    expect(bodySeen).toEqual(body)
    expect(r.announcementId).toBe(42)
  })

  it("listAnnouncements — page/size 직렬화 + Spring Page unwrap", async () => {
    let captured: URL | undefined
    server.use(
      http.get("*/api/v1/admin/announcements", ({ request }) => {
        captured = new URL(request.url)
        return HttpResponse.json({
          data: {
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: 1,
            size: 5,
          },
        })
      }),
    )
    const r = await listAnnouncements({ page: 1, size: 5 })
    expect(captured!.searchParams.get("page")).toBe("1")
    expect(captured!.searchParams.get("size")).toBe("5")
    expect(r.number).toBe(1)
    expect(r.size).toBe(5)
  })

  it("listAnnouncements — default (no params) — fixture 페이지 반환", async () => {
    const r = await listAnnouncements()
    expect(r.totalElements).toBe(3)
    expect(r.content.length).toBe(3)
  })

  it("cancelAnnouncement — DELETE 호출", async () => {
    let called = false
    server.use(
      http.delete("*/api/v1/admin/announcements/:id", ({ params }) => {
        called = true
        expect(params.id).toBe("99")
        return HttpResponse.json({ data: null })
      }),
    )
    await expect(cancelAnnouncement(99)).resolves.toBeUndefined()
    expect(called).toBe(true)
  })

  it("ANN-001 NOT_FOUND → ApiError 전파", async () => {
    server.use(
      http.delete("*/api/v1/admin/announcements/9999", () =>
        HttpResponse.json(annNotFoundError, { status: 404 }),
      ),
    )
    await expect(cancelAnnouncement(9999)).rejects.toMatchObject({
      status: 404,
      errorCode: "ANN-001",
    })
  })

  it("ANN-002 ALREADY_CANCELLED → ApiError 전파", async () => {
    server.use(
      http.delete("*/api/v1/admin/announcements/103", () =>
        HttpResponse.json(annAlreadyCancelledError, { status: 409 }),
      ),
    )
    await expect(cancelAnnouncement(103)).rejects.toMatchObject({
      status: 409,
      errorCode: "ANN-002",
    })
  })

  it("ANN-003 INVALID_SCHEDULE_FOR_TYPE → ApiError 전파", async () => {
    server.use(
      http.post("*/api/v1/admin/announcements", () =>
        HttpResponse.json(annInvalidScheduleForTypeError, { status: 400 }),
      ),
    )
    await expect(
      createAnnouncement({
        type: "EVENT",
        severity: "INFO",
        titleKo: "k",
        titleEn: "e",
        messageKo: "kb",
        messageEn: "eb",
        scheduledStartAt: null,
        scheduledEndAt: null,
        expiresAt: null,
      }),
    ).rejects.toBeInstanceOf(ApiError)
  })

  it("ANN-004 INVALID_SCHEDULE_WINDOW → ApiError 전파", async () => {
    server.use(
      http.post("*/api/v1/admin/announcements", () =>
        HttpResponse.json(annInvalidScheduleWindowError, { status: 400 }),
      ),
    )
    await expect(
      createAnnouncement({
        type: "MAINTENANCE_NOTICE",
        severity: "WARN",
        titleKo: "k",
        titleEn: "e",
        messageKo: "kb",
        messageEn: "eb",
        scheduledStartAt: "2099-01-01T01:00:00",
        scheduledEndAt: "2099-01-01T00:00:00",
        expiresAt: null,
      }),
    ).rejects.toMatchObject({ errorCode: "ANN-004" })
  })

  it("ANN-005 SCHEDULED_START_IN_PAST → ApiError 전파", async () => {
    server.use(
      http.post("*/api/v1/admin/announcements", () =>
        HttpResponse.json(annScheduledStartInPastError, { status: 400 }),
      ),
    )
    await expect(
      createAnnouncement({
        type: "MAINTENANCE_NOTICE",
        severity: "WARN",
        titleKo: "k",
        titleEn: "e",
        messageKo: "kb",
        messageEn: "eb",
        scheduledStartAt: "2000-01-01T00:00:00",
        scheduledEndAt: "2000-01-01T01:00:00",
        expiresAt: null,
      }),
    ).rejects.toMatchObject({ errorCode: "ANN-005" })
  })
})
