import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deletePersona } from "./personas-api"
import { mutationErrorToast } from "@/shared/lib/mutation-toast"

export function useDeletePersona() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deletePersona(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["virtual-crew", "personas"] })
    },
    onError: mutationErrorToast,
  })
}
