import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { bulkPartyroomAction } from "./bulk-partyrooms-api"
import { mutationErrorToast } from "@/shared/lib/mutation-toast"
import type {
  BulkPartyroomActionRequest,
  BulkPartyroomActionResponse,
} from "../model/bulk-schema"

export function useBulkPartyroomAction() {
  const qc = useQueryClient()
  return useMutation<
    BulkPartyroomActionResponse,
    unknown,
    BulkPartyroomActionRequest
  >({
    mutationFn: (body) => bulkPartyroomAction(body),
    onSuccess: (response) => {
      qc.invalidateQueries({ queryKey: ["partyrooms"] })
      const ok = response.results.filter((r) => r.success).length
      const ng = response.results.length - ok
      if (ng === 0) {
        toast.success(`일괄 처리 완료 (${ok}건)`)
      } else if (ok === 0) {
        toast.error("일괄 처리 전건 실패")
      } else {
        toast.warning(`성공 ${ok}건 / 실패 ${ng}건`)
      }
    },
    onError: mutationErrorToast,
  })
}
