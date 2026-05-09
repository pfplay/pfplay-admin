import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateAdministrator } from "./administrators-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"
import type { UpdateAdministratorRequest } from "../model/mutation-schema"

export function useUpdateAdministrator() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: number; body: UpdateAdministratorRequest }) =>
      updateAdministrator(vars.id, vars.body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["administrators"] })
      mutationSuccessToast("닉네임 변경 완료")
    },
    onError: mutationErrorToast,
  })
}
