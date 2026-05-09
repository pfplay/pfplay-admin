import { http } from "@/shared/api/http"
import { unwrap } from "@/shared/api/page"
import type { ApiCommonResponse, Page } from "@/shared/api/page"
import { serializeQuery } from "@/shared/lib/url-state"
import type { AdminPartyroomListItem, AdminPartyroomDetail } from "@/entities/partyroom"
import type { PartyroomsListQuery } from "../model/filter-schema"
import type {
  TerminateRequest,
  SuspendRequest,
  UpdatePartyroomMetaRequest,
  UpdateDisplayFlagRequest,
} from "../model/mutation-schema"

export async function listPartyrooms(
  query: PartyroomsListQuery,
): Promise<Page<AdminPartyroomListItem>> {
  const qs = serializeQuery(query as Record<string, unknown>).toString()
  const res = await http<ApiCommonResponse<Page<AdminPartyroomListItem>>>(
    `/api/v1/admin/partyrooms${qs ? `?${qs}` : ""}`,
  )
  return unwrap(res)
}

export async function getPartyroomDetail(
  partyroomId: number,
): Promise<AdminPartyroomDetail> {
  const res = await http<ApiCommonResponse<AdminPartyroomDetail>>(
    `/api/v1/admin/partyrooms/${partyroomId}`,
  )
  return unwrap(res)
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

export async function updatePartyroomMeta(
  partyroomId: number,
  body: UpdatePartyroomMetaRequest,
): Promise<void> {
  await http<void>(`/api/v1/admin/partyrooms/${partyroomId}`, {
    method: "PATCH",
    body,
  })
}

export async function updatePartyroomDisplayFlag(
  partyroomId: number,
  body: UpdateDisplayFlagRequest,
): Promise<void> {
  await http<void>(`/api/v1/admin/partyrooms/${partyroomId}/display-flag`, {
    method: "PATCH",
    body,
  })
}
