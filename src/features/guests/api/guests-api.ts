import { http } from "@/shared/api/http"
import { unwrap } from "@/shared/api/page"
import type { ApiCommonResponse, Page } from "@/shared/api/page"
import { serializeQuery } from "@/shared/lib/url-state"
import type { AdminGuestSummary, AdminGuestDetail } from "@/entities/guest"
import type { GuestsListQuery } from "../model/filter-schema"

export async function listGuests(
  query: GuestsListQuery,
): Promise<Page<AdminGuestSummary>> {
  const qs = serializeQuery(query as Record<string, unknown>).toString()
  const res = await http<ApiCommonResponse<Page<AdminGuestSummary>>>(
    `/api/v1/admin/guests${qs ? `?${qs}` : ""}`,
  )
  return unwrap(res)
}

export async function getGuestDetail(
  guestId: number,
): Promise<AdminGuestDetail> {
  const res = await http<ApiCommonResponse<AdminGuestDetail>>(
    `/api/v1/admin/guests/${guestId}`,
  )
  return unwrap(res)
}
