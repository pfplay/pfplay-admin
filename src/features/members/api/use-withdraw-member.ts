import { useMutation, useQueryClient } from "@tanstack/react-query"
import { withdrawMember } from "./members-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"

export function useWithdrawMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { memberId: number }) => withdrawMember(vars.memberId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["members"] })
      mutationSuccessToast(data.alreadyWithdrawn ? "이미 탈퇴된 회원입니다" : "탈퇴 처리 완료")
    },
    onError: mutationErrorToast,
  })
}
