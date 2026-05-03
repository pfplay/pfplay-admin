import { useMutation, useQueryClient } from "@tanstack/react-query"
import { attachMemberProfile } from "./administrators-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"
import type { AttachMemberProfileRequest } from "../model/mutation-schema"

export function useAttachMemberProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: number; body: AttachMemberProfileRequest }) =>
      attachMemberProfile(vars.id, vars.body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["administrators"] })
      mutationSuccessToast("멤버 프로필 연결 완료")
    },
    onError: mutationErrorToast,
  })
}
