import { useMutation, useQueryClient } from "@tanstack/react-query"
import { drain } from "./virtual-dj-room-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"

export function useDrainVirtualDj(partyroomId: number) {
  const qc = useQueryClient()
  return useMutation<void, unknown, void>({
    mutationFn: () => drain(partyroomId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["virtual-dj", "room", partyroomId] })
      qc.invalidateQueries({ queryKey: ["partyrooms"] })
      mutationSuccessToast("봇 전부 제거 완료")
    },
    onError: mutationErrorToast,
  })
}
