import { useMutation, useQueryClient } from "@tanstack/react-query"
import { revive } from "./virtual-crew-room-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"

// 회수했던 봇을 target 인원까지 재배치 — 부활.
export function useReviveVirtualCrew(partyroomId: number) {
  const qc = useQueryClient()
  return useMutation<void, unknown, void>({
    mutationFn: () => revive(partyroomId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["virtual-crew", "room", partyroomId] })
      qc.invalidateQueries({ queryKey: ["partyrooms"] })
      mutationSuccessToast("봇 부활 완료")
    },
    onError: mutationErrorToast,
  })
}
