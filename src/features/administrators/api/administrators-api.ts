import { http } from "@/shared/api/http"
import { unwrap } from "@/shared/api/page"
import type { ApiCommonResponse } from "@/shared/api/page"
import { serializeQuery } from "@/shared/lib/url-state"
import type {
  AdministratorView,
  AdministratorListResponse,
  CreateAdministratorResponse,
  ResetPasswordResponse,
} from "@/entities/administrator"
import type { AdministratorListQuery } from "../model/filter-schema"
import type {
  CreateAdministratorRequest,
  UpdateAdministratorRequest,
  AttachMemberProfileRequest,
} from "../model/mutation-schema"

const API = "/api/v1/admin/system/administrators"

export async function listAdministrators(
  query: AdministratorListQuery,
): Promise<AdministratorListResponse> {
  const qs = serializeQuery(query as Record<string, unknown>).toString()
  const res = await http<ApiCommonResponse<AdministratorListResponse>>(
    `${API}${qs ? `?${qs}` : ""}`,
  )
  return unwrap(res)
}

export async function createAdministrator(
  body: CreateAdministratorRequest,
): Promise<CreateAdministratorResponse> {
  const res = await http<ApiCommonResponse<CreateAdministratorResponse>>(API, {
    method: "POST",
    body,
  })
  return unwrap(res)
}

export async function updateAdministrator(
  id: number,
  body: UpdateAdministratorRequest,
): Promise<void> {
  await http<void>(`${API}/${id}`, { method: "PATCH", body })
}

export async function revokeAdministrator(id: number): Promise<void> {
  await http<void>(`${API}/${id}/revoke`, { method: "POST" })
}

export async function resetAdministratorPassword(
  id: number,
): Promise<ResetPasswordResponse> {
  const res = await http<ApiCommonResponse<ResetPasswordResponse>>(
    `${API}/${id}/reset-password`,
    { method: "POST" },
  )
  return unwrap(res)
}

export async function attachMemberProfile(
  id: number,
  body: AttachMemberProfileRequest,
): Promise<{ memberId: number }> {
  const res = await http<ApiCommonResponse<{ memberId: number }>>(
    `${API}/${id}/member-profile`,
    { method: "POST", body },
  )
  return unwrap(res)
}

// frontend 편의 — list 응답에서 단건 추출 (backend는 detail endpoint 미제공).
// list 자체가 작은 size (운영 어드민 수십 명 가정)라 가벼움. detail page는 list 응답 캐시 재사용.
export async function findAdministratorByIdFromList(
  id: number,
): Promise<AdministratorView | undefined> {
  const list = await listAdministrators({ includeRevoked: true })
  return list.items.find((a) => a.administratorId === id)
}
