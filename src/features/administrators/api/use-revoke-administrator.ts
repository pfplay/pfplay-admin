import { useMutation, useQueryClient } from "@tanstack/react-query"
import { revokeAdministrator } from "./administrators-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"

export function useRevokeAdministrator() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => revokeAdministrator(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["administrators"] })
      mutationSuccessToast("권한 회수 완료")
    },
    onError: mutationErrorToast,
  })
}
