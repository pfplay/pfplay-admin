import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createPersona } from "./personas-api"
import { mutationErrorToast } from "@/shared/lib/mutation-toast"
import type { CreatePersonaRequest } from "../model/persona-schema"

export function useCreatePersona() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreatePersonaRequest) => createPersona(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["virtual-crew", "personas"] })
    },
    onError: mutationErrorToast,
  })
}
