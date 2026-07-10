import { http } from "@/shared/api/http"
import { unwrap } from "@/shared/api/page"
import type { ApiCommonResponse } from "@/shared/api/page"
import type { VirtualCrewLiveStatus } from "@/entities/virtual-crew"
import type { VirtualCrewConfigRequest } from "../model/virtual-crew-config-schema"

// backend §5.3 — per-partyroom 가상 DJ:
//   GET  /api/v1/admin/partyrooms/{id}/virtual-crew                 → ApiCommonResponse<VirtualCrewLiveStatus>
//   PUT  /api/v1/admin/partyrooms/{id}/virtual-crew  (body)         → 204
//   POST /api/v1/admin/partyrooms/{id}/virtual-crew/drain           → 204 (봇 제거 + 상태 OFF)
//   POST /api/v1/admin/partyrooms/{id}/virtual-crew/drain-resources → 204 (봇만 회수, MANAGED 유지 — 부활 가능)
//   POST /api/v1/admin/partyrooms/{id}/virtual-crew/revive          → 204 (봇을 target 까지 재배치)
const base = (id: number) => `/api/v1/admin/partyrooms/${id}/virtual-crew`

export async function getLiveStatus(id: number): Promise<VirtualCrewLiveStatus> {
  const res = await http<ApiCommonResponse<VirtualCrewLiveStatus>>(base(id))
  return unwrap(res)
}

export async function applyConfig(
  id: number,
  body: VirtualCrewConfigRequest,
): Promise<void> {
  await http<void>(base(id), { method: "PUT", body })
}

export async function drain(id: number): Promise<void> {
  await http<void>(`${base(id)}/drain`, { method: "POST" })
}

export async function drainResources(id: number): Promise<void> {
  await http<void>(`${base(id)}/drain-resources`, { method: "POST" })
}

export async function revive(id: number): Promise<void> {
  await http<void>(`${base(id)}/revive`, { method: "POST" })
}
