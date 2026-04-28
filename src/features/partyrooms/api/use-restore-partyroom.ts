import { useMutation, useQueryClient } from "@tanstack/react-query"
import { restorePartyroom } from "./partyrooms-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"

export function useRestorePartyroom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { partyroomId: number }) => restorePartyroom(vars.partyroomId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partyrooms"] })
      mutationSuccessToast("재개 완료")
    },
    onError: mutationErrorToast,
  })
}
