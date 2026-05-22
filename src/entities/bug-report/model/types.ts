export interface AdminBugReportSummary {
  bugReportId: number
  reporterUserAccountId: number
  reporterEmail: string | null
  reporterNickname: string | null
  contentPreview: string
  partyroomId: number | null
  createdAt: string // ISO LocalDateTime
}

export interface AdminBugReportDetail {
  bugReportId: number
  reporterUserAccountId: number
  reporterEmail: string | null
  reporterNickname: string | null
  content: string
  pageUrl: string | null
  userAgent: string | null
  partyroomId: number | null
  partyroomName: string | null
  createdAt: string
}

export interface AdminBugReportListResponse {
  totalElements: number
  totalPages: number
  page: number
  size: number
  items: AdminBugReportSummary[]
}
