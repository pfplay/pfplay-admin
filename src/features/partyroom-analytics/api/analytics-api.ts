import { http } from "@/shared/api/http"
import { unwrap } from "@/shared/api/page"
import type { ApiCommonResponse, Page } from "@/shared/api/page"
import type { PartyroomAnalytics, DjHistoryItem } from "../model/types"

const base = (partyroomId: number) => `/api/v1/admin/partyrooms/${partyroomId}`

export async function getPartyroomAnalytics(
  partyroomId: number,
  days: number,
): Promise<PartyroomAnalytics> {
  const res = await http<ApiCommonResponse<PartyroomAnalytics>>(
    `${base(partyroomId)}/analytics?days=${days}`,
  )
  return unwrap(res)
}

export async function getPartyroomDjHistory(
  partyroomId: number,
  page: number,
  size: number,
): Promise<Page<DjHistoryItem>> {
  const res = await http<ApiCommonResponse<Page<DjHistoryItem>>>(
    `${base(partyroomId)}/dj-history?page=${page}&size=${size}`,
  )
  return unwrap(res)
}
