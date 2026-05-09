import { describe, it, expect } from "vitest"
import {
  ReportStatusUpdateSchema,
  canTransition,
  TERMINAL_STATUSES,
} from "../transition-schema"

describe("canTransition (transition matrix D3)", () => {
  it("PENDING → REVIEWING / DISMISSED 허용", () => {
    expect(canTransition("PENDING", "REVIEWING")).toBe(true)
    expect(canTransition("PENDING", "DISMISSED")).toBe(true)
  })

  it("PENDING → RESOLVED / PENDING 불허", () => {
    expect(canTransition("PENDING", "RESOLVED")).toBe(false)
    expect(canTransition("PENDING", "PENDING")).toBe(false)
  })

  it("REVIEWING → RESOLVED / DISMISSED / PENDING 허용", () => {
    expect(canTransition("REVIEWING", "RESOLVED")).toBe(true)
    expect(canTransition("REVIEWING", "DISMISSED")).toBe(true)
    expect(canTransition("REVIEWING", "PENDING")).toBe(true)
  })

  it("REVIEWING → REVIEWING 불허", () => {
    expect(canTransition("REVIEWING", "REVIEWING")).toBe(false)
  })

  it("RESOLVED / DISMISSED → 모두 불허 (terminal)", () => {
    expect(canTransition("RESOLVED", "PENDING")).toBe(false)
    expect(canTransition("RESOLVED", "REVIEWING")).toBe(false)
    expect(canTransition("DISMISSED", "PENDING")).toBe(false)
    expect(canTransition("DISMISSED", "REVIEWING")).toBe(false)
  })

  it("TERMINAL_STATUSES set은 RESOLVED + DISMISSED만 포함", () => {
    expect(TERMINAL_STATUSES.has("RESOLVED")).toBe(true)
    expect(TERMINAL_STATUSES.has("DISMISSED")).toBe(true)
    expect(TERMINAL_STATUSES.has("PENDING")).toBe(false)
    expect(TERMINAL_STATUSES.has("REVIEWING")).toBe(false)
  })
})

describe("ReportStatusUpdateSchema", () => {
  it("non-terminal target + empty note OK", () => {
    expect(
      ReportStatusUpdateSchema.parse({ status: "REVIEWING", resolutionNote: "" }),
    ).toMatchObject({ status: "REVIEWING" })
    expect(
      ReportStatusUpdateSchema.parse({ status: "PENDING" }),
    ).toMatchObject({ status: "PENDING" })
  })

  it("terminal target + filled note OK", () => {
    expect(
      ReportStatusUpdateSchema.parse({
        status: "RESOLVED",
        resolutionNote: "조치 완료",
      }),
    ).toMatchObject({ status: "RESOLVED", resolutionNote: "조치 완료" })
  })

  it("terminal target + empty note → refine fail", () => {
    expect(() =>
      ReportStatusUpdateSchema.parse({ status: "RESOLVED", resolutionNote: "" }),
    ).toThrow()
    expect(() =>
      ReportStatusUpdateSchema.parse({ status: "DISMISSED" }),
    ).toThrow()
  })

  it("terminal target + whitespace-only note → refine fail", () => {
    expect(() =>
      ReportStatusUpdateSchema.parse({
        status: "RESOLVED",
        resolutionNote: "   \n\t  ",
      }),
    ).toThrow()
  })

  it("rejects unknown status", () => {
    expect(() =>
      ReportStatusUpdateSchema.parse({ status: "ESCALATED" }),
    ).toThrow()
  })

  it("rejects note > 2000 chars", () => {
    expect(() =>
      ReportStatusUpdateSchema.parse({
        status: "RESOLVED",
        resolutionNote: "a".repeat(2001),
      }),
    ).toThrow()
  })
})
