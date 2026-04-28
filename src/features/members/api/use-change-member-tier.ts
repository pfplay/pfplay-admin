import { useMutation, useQueryClient } from "@tanstack/react-query"
import { changeMemberTier } from "./members-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"
import type { AuthorityTier } from "@/entities/member/model/types"

export function useChangeMemberTier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { memberId: number; tier: AuthorityTier }) =>
      changeMemberTier(vars.memberId, { tier: vars.tier }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] })
      mutationSuccessToast("등급 변경 완료")
    },
    onError: mutationErrorToast,
  })
}
