import { http } from "@/shared/api/http"
import { unwrap } from "@/shared/api/page"
import type { ApiCommonResponse, Page } from "@/shared/api/page"
import { serializeQuery } from "@/shared/lib/url-state"
import type { AdminMemberSummary, AdminMemberDetail } from "@/entities/member"
import type {
  AdminMemberTierChangeResponse,
  AdminMemberWithdrawResponse,
} from "@/entities/member/model/types"
import type { MembersListQuery } from "../model/filter-schema"
import type { ChangeMemberTierRequest } from "../model/mutation-schema"

export async function listMembers(query: MembersListQuery): Promise<Page<AdminMemberSummary>> {
  const qs = serializeQuery(query as Record<string, unknown>).toString()
  const res = await http<ApiCommonResponse<Page<AdminMemberSummary>>>(
    `/api/v1/admin/members${qs ? `?${qs}` : ""}`,
  )
  return unwrap(res)
}

export async function getMemberDetail(memberId: number): Promise<AdminMemberDetail> {
  const res = await http<ApiCommonResponse<AdminMemberDetail>>(
    `/api/v1/admin/members/${memberId}`,
  )
  return unwrap(res)
}

export async function changeMemberTier(
  memberId: number,
  body: ChangeMemberTierRequest,
): Promise<AdminMemberTierChangeResponse> {
  const res = await http<ApiCommonResponse<AdminMemberTierChangeResponse>>(
    `/api/v1/admin/members/${memberId}/tier`,
    { method: "PATCH", body },
  )
  return unwrap(res)
}

export async function withdrawMember(memberId: number): Promise<AdminMemberWithdrawResponse> {
  const res = await http<ApiCommonResponse<AdminMemberWithdrawResponse>>(
    `/api/v1/admin/members/${memberId}/withdraw`,
    { method: "POST" },
  )
  return unwrap(res)
}
