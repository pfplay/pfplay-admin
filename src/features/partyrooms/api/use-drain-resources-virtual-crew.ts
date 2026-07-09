import { useMutation, useQueryClient } from "@tanstack/react-query"
import { drainResources } from "./virtual-crew-room-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"

// 봇 리소스만 회수하고 운영 상태(MANAGED)는 유지 — 부활 가능.
export function useDrainResourcesVirtualCrew(partyroomId: number) {
  const qc = useQueryClient()
  return useMutation<void, unknown, void>({
    mutationFn: () => drainResources(partyroomId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["virtual-crew", "room", partyroomId] })
      qc.invalidateQueries({ queryKey: ["partyrooms"] })
      mutationSuccessToast("봇 리소스 회수 완료")
    },
    onError: mutationErrorToast,
  })
}
