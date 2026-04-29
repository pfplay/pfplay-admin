import { http } from "@/shared/api/http"
import { unwrap } from "@/shared/api/page"
import type { ApiCommonResponse, Page } from "@/shared/api/page"
import type { AdminReportSummary, AdminReportDetail } from "@/entities/report"
import type { ReportsListQuery } from "../model/filter-schema"
import type { ReportStatusUpdateRequest } from "../model/transition-schema"

/**
 * status[] / category[] multi 파라미터 직렬화 — `URLSearchParams.append` 패턴.
 * `serializeQuery` (14b) 는 multi-value를 지원 안 해 reports 전용 직렬화.
 */
function serializeReportsQuery(query: ReportsListQuery): URLSearchParams {
  const params = new URLSearchParams()
  if (query.status) query.status.forEach((s) => params.append("status", s))
  if (query.category) query.category.forEach((c) => params.append("category", c))
  if (query.createdFrom) params.set("created_from", query.createdFrom)
  if (query.createdTo) params.set("created_to", query.createdTo)
  params.set("page", String(query.page))
  params.set("size", String(query.size))
  params.set("sort", query.sort)
  return params
}

export async function listReports(
  query: ReportsListQuery,
): Promise<Page<AdminReportSummary>> {
  const qs = serializeReportsQuery(query).toString()
  const res = await http<ApiCommonResponse<Page<AdminReportSummary>>>(
    `/api/v1/admin/reports?${qs}`,
  )
  return unwrap(res)
}

export async function getReportDetail(reportId: number): Promise<AdminReportDetail> {
  const res = await http<ApiCommonResponse<AdminReportDetail>>(
    `/api/v1/admin/reports/${reportId}`,
  )
  return unwrap(res)
}

export async function updateReportStatus(
  reportId: number,
  body: ReportStatusUpdateRequest,
): Promise<AdminReportDetail> {
  const res = await http<ApiCommonResponse<AdminReportDetail>>(
    `/api/v1/admin/reports/${reportId}`,
    { method: "PATCH", body },
  )
  return unwrap(res)
}
