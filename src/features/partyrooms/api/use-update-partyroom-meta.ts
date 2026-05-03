import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updatePartyroomMeta } from "./partyrooms-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"
import type { UpdatePartyroomMetaRequest } from "../model/mutation-schema"

export function useUpdatePartyroomMeta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { partyroomId: number; body: UpdatePartyroomMetaRequest }) =>
      updatePartyroomMeta(vars.partyroomId, vars.body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partyrooms"] })
      mutationSuccessToast("메타 수정 완료")
    },
    onError: mutationErrorToast,
  })
}
