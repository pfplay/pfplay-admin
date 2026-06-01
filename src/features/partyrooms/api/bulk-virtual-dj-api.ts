import { http } from "@/shared/api/http"
import type { VirtualDjBulkRequest } from "../model/virtual-dj-bulk-schema"

// backend §5.2 — PUT /api/v1/admin/virtual-dj/bulk → 204 (per-room 결과 없음)
// NOTE: 이 엔드포인트는 /admin/partyrooms 가 아니라 /admin/virtual-dj 하위라 full path 사용.
export async function bulkApplyVirtualDj(
  body: VirtualDjBulkRequest,
): Promise<void> {
  await http<void>(`/api/v1/admin/virtual-dj/bulk`, {
    method: "PUT",
    body,
  })
}
