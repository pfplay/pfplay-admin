import { http } from "@/shared/api/http"
import type {
  BulkPartyroomActionRequest,
  BulkPartyroomActionResponse,
} from "../model/bulk-schema"

export async function bulkPartyroomAction(
  body: BulkPartyroomActionRequest,
): Promise<BulkPartyroomActionResponse> {
  return http<BulkPartyroomActionResponse>(`/api/v1/admin/partyrooms/bulk-action`, {
    method: "POST",
    body,
  })
}
