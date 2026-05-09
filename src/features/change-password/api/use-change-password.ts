import { useMutation } from "@tanstack/react-query"
import { sessionApi, useSessionStore } from "@/entities/session"
import type { ChangePasswordCommand } from "@/entities/session"

export function useChangePassword(onSuccess?: () => void) {
  return useMutation({
    mutationFn: (cmd: ChangePasswordCommand) => sessionApi.changePassword(cmd),
    onSuccess: () => {
      useSessionStore.getState().clearMustChangePassword()
      onSuccess?.()
    },
  })
}
