import { useMutation } from "@tanstack/react-query"
import { sessionApi, useSessionStore, type SessionMeta } from "@/entities/session"
import type { LoginCommand } from "@/entities/session"

export function useLogin(onSuccess?: (meta: SessionMeta) => void) {
  return useMutation({
    mutationFn: (cmd: LoginCommand) => sessionApi.login(cmd),
    onSuccess: (meta) => {
      useSessionStore.getState().setSession(meta)
      onSuccess?.(meta)
    },
  })
}
