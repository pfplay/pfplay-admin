import { useMutation, useQueryClient } from "@tanstack/react-query"
import { terminatePartyroom } from "./partyrooms-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"

export function useTerminatePartyroom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { partyroomId: number; reason: string }) =>
      terminatePartyroom(vars.partyroomId, { reason: vars.reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partyrooms"] })
      mutationSuccessToast("강제 종료 완료")
    },
    onError: mutationErrorToast,
  })
}
