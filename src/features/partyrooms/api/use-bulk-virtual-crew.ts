import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { bulkApplyVirtualCrew } from "./bulk-virtual-crew-api"
import { mutationErrorToast } from "@/shared/lib/mutation-toast"
import type { VirtualCrewBulkRequest } from "../model/virtual-crew-bulk-schema"

export function useBulkVirtualCrew() {
  const qc = useQueryClient()
  return useMutation<void, unknown, VirtualCrewBulkRequest>({
    mutationFn: (body) => bulkApplyVirtualCrew(body),
    onSuccess: (_void, variables) => {
      // 봇 컬럼이 갱신되도록 파티룸 목록 쿼리 invalidate (use-partyrooms-list 와 동일 키 prefix)
      qc.invalidateQueries({ queryKey: ["partyrooms"] })
      toast.success(`가상 DJ 일괄 적용 완료 (${variables.partyroomIds.length}건)`)
    },
    onError: mutationErrorToast,
  })
}
