import { z } from "zod"
import { ReportStatusEnum, type ReportStatus } from "./filter-schema"

/** Backend transition matrix (D3) — `pfplay-platform/AdminReport*` */
export const TRANSITION_MATRIX: Record<ReportStatus, ReportStatus[]> = {
  PENDING: ["REVIEWING", "DISMISSED"],
  REVIEWING: ["RESOLVED", "DISMISSED", "PENDING"],
  RESOLVED: [],
  DISMISSED: [],
}

/** Terminal statuses — backend RPT-003 RESOLUTION_NOTE_REQUIRED 검증 trigger */
export const TERMINAL_STATUSES = new Set<ReportStatus>(["RESOLVED", "DISMISSED"])

export function canTransition(from: ReportStatus, to: ReportStatus): boolean {
  return TRANSITION_MATRIX[from].includes(to)
}

/**
 * PATCH /admin/reports/:id body schema.
 * - terminal target (RESOLVED/DISMISSED) 진입 시 resolutionNote 비어있지 않음 — frontend refine
 *   (defense-in-depth — backend RPT-003 service-layer guard도 존재)
 * - non-terminal target은 resolutionNote optional
 */
export const ReportStatusUpdateSchema = z
  .object({
    status: ReportStatusEnum,
    resolutionNote: z.string().max(2000).optional().nullable(),
  })
  .refine(
    (v) =>
      !TERMINAL_STATUSES.has(v.status) ||
      (v.resolutionNote?.trim().length ?? 0) >= 1,
    {
      message: "처리 완료/기각 시 처리 메모는 필수입니다",
      path: ["resolutionNote"],
    },
  )

export type ReportStatusUpdateRequest = z.infer<typeof ReportStatusUpdateSchema>
