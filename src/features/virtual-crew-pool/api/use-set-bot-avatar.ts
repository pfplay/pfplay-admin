import { useMutation, useQueryClient } from "@tanstack/react-query"
import { setBotAvatar } from "./bots-api"
import { mutationErrorToast } from "@/shared/lib/mutation-toast"

interface SetBotAvatarVars {
  userId: number
  avatarBodyUri: string
}

export function useSetBotAvatar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, avatarBodyUri }: SetBotAvatarVars) =>
      setBotAvatar(userId, avatarBodyUri),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["virtual-crew", "bots"] })
    },
    onError: mutationErrorToast,
  })
}
