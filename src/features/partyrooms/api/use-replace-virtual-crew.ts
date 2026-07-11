import { useMutation, useQueryClient } from "@tanstack/react-query"
import { replace } from "./virtual-crew-room-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"

// 봇 전원 회수 후 현재 config·송팩 기준으로 재배치 — 송팩 교체/곡 구성 변경 반영용.
export function useReplaceVirtualCrew(partyroomId: number) {
  const qc = useQueryClient()
  return useMutation<void, unknown, void>({
    mutationFn: () => replace(partyroomId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["virtual-crew", "room", partyroomId] })
      qc.invalidateQueries({ queryKey: ["partyrooms"] })
      mutationSuccessToast("재배치 완료")
    },
    onError: mutationErrorToast,
  })
}
