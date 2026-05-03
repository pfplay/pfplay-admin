/**
 * Backend mirror — `pfplay-platform/admin-platform-pr13` C-2 신고 도메인.
 *
 * - `ReportStatus` / `ReportCategory` enum: backend `domain/enums/{ReportStatus,ReportCategory}`
 * - `AdminReportSummary`: backend `AdminReportSummaryResponse` 1:1
 * - `AdminReportDetail`: backend `AdminReportDetailResponse` (cross-context loose-ref join)
 *
 * Cross-context orphan tolerance (D7) — 외부 BC 엔티티 부재 시 nested record는 항상 build,
 * 내부 nullable 필드만 null. frontend에서 null fallback "(N/A)" 또는 "(삭제됨)" 렌더.
 */

export type ReportStatus = "PENDING" | "REVIEWING" | "RESOLVED" | "DISMISSED"

export type ReportCategory =
  | "INAPPROPRIATE_CONTENT"
  | "HARASSMENT"
  | "SPAM"
  | "COPYRIGHT"
  | "OTHER"

export interface AdminReportSummary {
  reportId: number
  partyroomId: number
  reporterUserAccountId: number
  category: ReportCategory
  status: ReportStatus
  /** LocalDateTime ISO (KST 가정 — 14b §11 footer 일관) */
  createdAt: string
  /** PENDING 시 null */
  reviewedByAdministratorId: number | null
  /** PENDING/REVIEWING 시 null */
  resolvedAt: string | null
}

export interface ReporterMeta {
  userAccountId: number
  /** orphan 시 null */
  email: string | null
  /** orphan 시 null */
  nickname: string | null
}

export interface PartyroomHostMeta {
  userAccountId: number
  /** orphan 시 null */
  nickname: string | null
}

export interface PartyroomMeta {
  partyroomId: number
  /** orphan 시 null */
  title: string | null
  /** orphan 시 null */
  host: PartyroomHostMeta | null
}

export interface ReportReviewMeta {
  /** PENDING 시 null */
  reviewedByAdministratorId: number | null
  /** PENDING/REVIEWING 또는 빈 입력 시 null */
  resolutionNote: string | null
  /** PENDING/REVIEWING 시 null */
  resolvedAt: string | null
}

export interface AdminReportDetail {
  reportId: number
  status: ReportStatus
  category: ReportCategory
  description: string
  reporter: ReporterMeta
  partyroom: PartyroomMeta
  review: ReportReviewMeta
  createdAt: string
}
