import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { withdrawMember } from "./members-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"

export function useWithdrawMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { memberId: number }) => withdrawMember(vars.memberId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["members"] })
      // G5.2: idempotent 재호출(alreadyWithdrawn=true)은 실제 mutation이 발생하지 않음 →
      // success가 아니라 info 토스트로 차별화 (사용자가 "방금 탈퇴 처리됨"으로 오해 방지).
      if (data.alreadyWithdrawn) {
        toast.info("이미 탈퇴된 회원입니다")
      } else {
        mutationSuccessToast("탈퇴 처리 완료")
      }
    },
    onError: mutationErrorToast,
  })
}
