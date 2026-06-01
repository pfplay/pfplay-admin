import { useMutation, useQueryClient } from "@tanstack/react-query"
import { freeze } from "./virtual-dj-room-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"

export function useFreezeVirtualDj(partyroomId: number) {
  const qc = useQueryClient()
  return useMutation<void, unknown, void>({
    mutationFn: () => freeze(partyroomId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["virtual-dj", "room", partyroomId] })
      qc.invalidateQueries({ queryKey: ["partyrooms"] })
      mutationSuccessToast("봇 동결 완료")
    },
    onError: mutationErrorToast,
  })
}
