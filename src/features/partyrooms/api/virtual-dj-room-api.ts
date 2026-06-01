import { http } from "@/shared/api/http"
import { unwrap } from "@/shared/api/page"
import type { ApiCommonResponse } from "@/shared/api/page"
import type { VirtualDjLiveStatus } from "@/entities/virtual-dj"
import type { VirtualDjConfigRequest } from "../model/virtual-dj-config-schema"

// backend §5.3 — per-partyroom 가상 DJ:
//   GET  /api/v1/admin/partyrooms/{id}/virtual-dj         → ApiCommonResponse<VirtualDjLiveStatus>
//   PUT  /api/v1/admin/partyrooms/{id}/virtual-dj  (body) → 204
//   POST /api/v1/admin/partyrooms/{id}/virtual-dj/drain   → 204 (봇 전부 제거)
//   POST /api/v1/admin/partyrooms/{id}/virtual-dj/freeze  → 204
const base = (id: number) => `/api/v1/admin/partyrooms/${id}/virtual-dj`

export async function getLiveStatus(id: number): Promise<VirtualDjLiveStatus> {
  const res = await http<ApiCommonResponse<VirtualDjLiveStatus>>(base(id))
  return unwrap(res)
}

export async function applyConfig(
  id: number,
  body: VirtualDjConfigRequest,
): Promise<void> {
  await http<void>(base(id), { method: "PUT", body })
}

export async function drain(id: number): Promise<void> {
  await http<void>(`${base(id)}/drain`, { method: "POST" })
}

export async function freeze(id: number): Promise<void> {
  await http<void>(`${base(id)}/freeze`, { method: "POST" })
}
