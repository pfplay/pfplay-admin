import { useMutation, useQueryClient } from "@tanstack/react-query"
import { assignPersona, unassignPersona } from "./bots-api"
import { mutationErrorToast } from "@/shared/lib/mutation-toast"

interface AssignVars {
  botIds: string[]
  personaId: number
}

/** 선택된 봇들에 페르소나 1개를 일괄 지정한다. */
export function useAssignPersona() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ botIds, personaId }: AssignVars) =>
      assignPersona(botIds, personaId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["virtual-crew", "bots"] })
    },
    onError: mutationErrorToast,
  })
}

/** 선택된 봇들의 페르소나 매핑을 일괄 해제한다. */
export function useUnassignPersona() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (botIds: string[]) => unassignPersona(botIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["virtual-crew", "bots"] })
    },
    onError: mutationErrorToast,
  })
}
