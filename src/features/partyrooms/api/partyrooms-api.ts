import { http } from "@/shared/api/http"
import type { Page } from "@/shared/api/page"
import { serializeQuery } from "@/shared/lib/url-state"
import type { AdminPartyroomListItem, AdminPartyroomDetail } from "@/entities/partyroom"
import type { PartyroomsListQuery } from "../model/filter-schema"
import type { TerminateRequest, SuspendRequest } from "../model/mutation-schema"

/**
 * Raw Page<T> 반환 — backend가 ApiCommonResponse wrap 안 함 (spec §4.1).
 * §13.2 future polish에서 백엔드 일괄 통일 후 unwrap() 일괄 적용 예정.
 */
export async function listPartyrooms(
  query: PartyroomsListQuery,
): Promise<Page<AdminPartyroomListItem>> {
  const qs = serializeQuery(query as Record<string, unknown>).toString()
  return http<Page<AdminPartyroomListItem>>(
    `/api/v1/admin/partyrooms${qs ? `?${qs}` : ""}`,
  )
}

export async function getPartyroomDetail(
  partyroomId: number,
): Promise<AdminPartyroomDetail> {
  return http<AdminPartyroomDetail>(`/api/v1/admin/partyrooms/${partyroomId}`)
}

export async function terminatePartyroom(
  partyroomId: number,
  body: TerminateRequest,
): Promise<void> {
  await http<void>(`/api/v1/admin/partyrooms/${partyroomId}/terminate`, {
    method: "POST",
    body,
  })
}

export async function suspendPartyroom(
  partyroomId: number,
  body: SuspendRequest,
): Promise<void> {
  await http<void>(`/api/v1/admin/partyrooms/${partyroomId}/suspend`, {
    method: "POST",
    body,
  })
}

export async function restorePartyroom(partyroomId: number): Promise<void> {
  await http<void>(`/api/v1/admin/partyrooms/${partyroomId}/restore`, {
    method: "POST",
  })
}
