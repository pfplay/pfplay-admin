import { http } from "@/shared/api/http"
import { unwrap } from "@/shared/api/page"
import type { ApiCommonResponse } from "@/shared/api/page"
import type {
  AnnouncementListResponse,
  CreateAnnouncementResponse,
} from "@/entities/announcement"
import type { CreateAnnouncementRequest } from "../model/mutation-schema"

const API = "/api/v1/admin/announcements"

export async function createAnnouncement(
  body: CreateAnnouncementRequest,
): Promise<CreateAnnouncementResponse> {
  const res = await http<ApiCommonResponse<CreateAnnouncementResponse>>(API, {
    method: "POST",
    body,
  })
  return unwrap(res)
}

export interface ListAnnouncementsQuery {
  page?: number
  size?: number
}

export async function listAnnouncements(
  query: ListAnnouncementsQuery = {},
): Promise<AnnouncementListResponse> {
  const params = new URLSearchParams()
  if (query.page !== undefined) params.set("page", String(query.page))
  if (query.size !== undefined) params.set("size", String(query.size))
  const qs = params.toString()
  const res = await http<ApiCommonResponse<AnnouncementListResponse>>(
    `${API}${qs ? `?${qs}` : ""}`,
  )
  return unwrap(res)
}

export async function cancelAnnouncement(id: number): Promise<void> {
  await http<void>(`${API}/${id}`, { method: "DELETE" })
}

export async function adjustAnnouncementSchedule(
  id: number,
  scheduledEndAt: string,
): Promise<void> {
  await http<void>(`${API}/${id}/schedule`, {
    method: "PATCH",
    body: { scheduledEndAt },
  })
}

export async function completeAnnouncement(id: number): Promise<void> {
  await http<void>(`${API}/${id}/complete`, { method: "POST" })
}
