import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updatePartyroomDisplayFlag } from "./partyrooms-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"
import type { UpdateDisplayFlagRequest } from "../model/mutation-schema"

export function useUpdatePartyroomDisplayFlag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { partyroomId: number; body: UpdateDisplayFlagRequest }) =>
      updatePartyroomDisplayFlag(vars.partyroomId, vars.body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partyrooms"] })
      mutationSuccessToast("표시 변경 완료")
    },
    onError: mutationErrorToast,
  })
}
