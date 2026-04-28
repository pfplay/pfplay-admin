import { useMutation, useQueryClient } from "@tanstack/react-query"
import { suspendPartyroom } from "./partyrooms-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"

export function useSuspendPartyroom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { partyroomId: number; reason: string }) =>
      suspendPartyroom(vars.partyroomId, { reason: vars.reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partyrooms"] })
      mutationSuccessToast("일시 정지 완료")
    },
    onError: mutationErrorToast,
  })
}
