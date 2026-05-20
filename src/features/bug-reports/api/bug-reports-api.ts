import { http } from "@/shared/api/http"
import { unwrap } from "@/shared/api/page"
import type { ApiCommonResponse } from "@/shared/api/page"
import { serializeQuery } from "@/shared/lib/url-state"
import type {
  AdminBugReportListResponse,
  AdminBugReportDetail,
} from "@/entities/bug-report"
import type { BugReportsListQuery } from "../model/filter-schema"

export async function listBugReports(
  query: BugReportsListQuery,
): Promise<AdminBugReportListResponse> {
  const qs = serializeQuery(query as Record<string, unknown>).toString()
  const res = await http<ApiCommonResponse<AdminBugReportListResponse>>(
    `/api/v1/admin/voc/bug-reports${qs ? `?${qs}` : ""}`,
  )
  return unwrap(res)
}

interface BugReportDetailResponse {
  detail: AdminBugReportDetail
}

export async function getBugReportDetail(
  bugReportId: number,
): Promise<AdminBugReportDetail> {
  const res = await http<ApiCommonResponse<BugReportDetailResponse>>(
    `/api/v1/admin/voc/bug-reports/${bugReportId}`,
  )
  return unwrap(res).detail
}
