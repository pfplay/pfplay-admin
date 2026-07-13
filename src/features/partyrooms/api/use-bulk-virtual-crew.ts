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
      // 목록(봇 컬럼) + 파티룸 상세의 live 상태(["virtual-crew","room",id]) 양쪽 갱신 —
      // 그래야 크루 배치에서 일괄 적용한 값이 파티룸 상세 카드와 동기화된다.
      qc.invalidateQueries({ queryKey: ["partyrooms"] })
      qc.invalidateQueries({ queryKey: ["virtual-crew"] })
      toast.success(`가상 크루 일괄 적용 완료 (${variables.partyroomIds.length}건)`)
    },
    onError: mutationErrorToast,
  })
}
