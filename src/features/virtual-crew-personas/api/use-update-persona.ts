import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updatePersona } from "./personas-api"
import { mutationErrorToast } from "@/shared/lib/mutation-toast"
import type { UpdatePersonaRequest } from "../model/persona-schema"

export function useUpdatePersona() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdatePersonaRequest }) =>
      updatePersona(id, body),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["virtual-crew", "personas"] })
      qc.invalidateQueries({ queryKey: ["virtual-crew", "persona", id] })
    },
    onError: mutationErrorToast,
  })
}
