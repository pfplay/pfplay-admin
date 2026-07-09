import { http } from "@/shared/api/http"
import type { VirtualCrewBulkRequest } from "../model/virtual-crew-bulk-schema"

// backend §5.2 — PUT /api/v1/admin/virtual-crew/bulk → 204 (per-room 결과 없음)
// NOTE: 이 엔드포인트는 /admin/partyrooms 가 아니라 /admin/virtual-crew 하위라 full path 사용.
export async function bulkApplyVirtualCrew(
  body: VirtualCrewBulkRequest,
): Promise<void> {
  await http<void>(`/api/v1/admin/virtual-crew/bulk`, {
    method: "PUT",
    body,
  })
}
