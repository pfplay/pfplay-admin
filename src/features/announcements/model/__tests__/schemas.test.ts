import { describe, it, expect } from "vitest"
import { createAnnouncementRequestSchema } from "../mutation-schema"

// datetime-local 입력 형식 ("YYYY-MM-DDTHH:mm:ss") — schema 는 local timezone 으로 parse 하므로
// toISOString() (UTC) 을 쓰면 KST runner 와 9시간 차이 나 미래/과거 검증이 뒤집힌다.
const localShift = (offsetMs: number) => {
  const d = new Date(Date.now() + offsetMs)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const future = (offsetMs: number) => localShift(offsetMs)
const past = (offsetMs: number) => localShift(-offsetMs)

const baseValid = {
  type: "MAINTENANCE_NOTICE" as const,
  severity: "WARN" as const,
  titleKo: "제목",
  titleEn: "Title",
  messageKo: "본문",
  messageEn: "Body",
  scheduledStartAt: future(60 * 60 * 1000), // +1h
  scheduledEndAt: future(2 * 60 * 60 * 1000), // +2h
  expiresAt: null,
}

describe("createAnnouncementRequestSchema", () => {
  it("정상 — MAINTENANCE_NOTICE 미래 윈도우", () => {
    const r = createAnnouncementRequestSchema.safeParse(baseValid)
    expect(r.success).toBe(true)
  })

  it("정상 — EVENT (schedule null, expires null)", () => {
    const r = createAnnouncementRequestSchema.safeParse({
      ...baseValid,
      type: "EVENT",
      severity: "INFO",
      scheduledStartAt: null,
      scheduledEndAt: null,
    })
    expect(r.success).toBe(true)
  })

  it("정상 — EVENT + expiresAt 미래", () => {
    const r = createAnnouncementRequestSchema.safeParse({
      ...baseValid,
      type: "EVENT",
      severity: "INFO",
      scheduledStartAt: null,
      scheduledEndAt: null,
      expiresAt: future(24 * 60 * 60 * 1000),
    })
    expect(r.success).toBe(true)
  })

  it("titleKo 비어있으면 거부", () => {
    const r = createAnnouncementRequestSchema.safeParse({ ...baseValid, titleKo: "" })
    expect(r.success).toBe(false)
  })

  it("titleEn 비어있으면 거부 (i18n 동시 입력 강제)", () => {
    const r = createAnnouncementRequestSchema.safeParse({ ...baseValid, titleEn: "" })
    expect(r.success).toBe(false)
  })

  it("messageKo 2000자 초과 거부", () => {
    const r = createAnnouncementRequestSchema.safeParse({
      ...baseValid,
      messageKo: "x".repeat(2001),
    })
    expect(r.success).toBe(false)
  })

  it("MAINTENANCE_NOTICE — scheduledStartAt 누락 거부", () => {
    const r = createAnnouncementRequestSchema.safeParse({
      ...baseValid,
      scheduledStartAt: null,
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "scheduledStartAt")).toBe(true)
    }
  })

  it("MAINTENANCE_NOTICE — scheduledEndAt 누락 거부", () => {
    const r = createAnnouncementRequestSchema.safeParse({
      ...baseValid,
      scheduledEndAt: null,
    })
    expect(r.success).toBe(false)
  })

  it("MAINTENANCE_NOTICE — end <= start 거부 (ANN-004 의미)", () => {
    const r = createAnnouncementRequestSchema.safeParse({
      ...baseValid,
      scheduledStartAt: future(2 * 60 * 60 * 1000),
      scheduledEndAt: future(1 * 60 * 60 * 1000),
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "scheduledEndAt")).toBe(true)
    }
  })

  it("MAINTENANCE_NOTICE — start 가 과거면 거부 (ANN-005 의미)", () => {
    const r = createAnnouncementRequestSchema.safeParse({
      ...baseValid,
      scheduledStartAt: past(60 * 60 * 1000),
      scheduledEndAt: future(60 * 60 * 1000),
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "scheduledStartAt")).toBe(true)
    }
  })

  it("MAINTENANCE_NOTICE — expiresAt 사용 시 거부 (ANN-003 의미)", () => {
    const r = createAnnouncementRequestSchema.safeParse({
      ...baseValid,
      expiresAt: future(24 * 60 * 60 * 1000),
    })
    expect(r.success).toBe(false)
  })

  it("EVENT — schedule 사용 시 거부 (ANN-003 의미)", () => {
    const r = createAnnouncementRequestSchema.safeParse({
      ...baseValid,
      type: "EVENT",
      severity: "INFO",
    })
    expect(r.success).toBe(false)
  })

  it("EMERGENCY — schedule 사용 시 거부", () => {
    const r = createAnnouncementRequestSchema.safeParse({
      ...baseValid,
      type: "EMERGENCY",
      severity: "CRITICAL",
    })
    expect(r.success).toBe(false)
  })

  it("datetime 형식 위반 거부", () => {
    const r = createAnnouncementRequestSchema.safeParse({
      ...baseValid,
      scheduledStartAt: "not-a-date",
    })
    expect(r.success).toBe(false)
  })
})
