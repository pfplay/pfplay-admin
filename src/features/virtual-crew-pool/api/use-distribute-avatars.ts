import { useMutation, useQueryClient } from "@tanstack/react-query"
import { distributeAvatars } from "./bots-api"
import { mutationErrorToast } from "@/shared/lib/mutation-toast"

interface DistributeVars {
  botIds: number[]
  bodyUris: string[]
}

export function useDistributeAvatars() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ botIds, bodyUris }: DistributeVars) =>
      distributeAvatars(botIds, bodyUris),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["virtual-crew", "bots"] })
    },
    onError: mutationErrorToast,
  })
}
