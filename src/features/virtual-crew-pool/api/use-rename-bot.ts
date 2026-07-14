import { useMutation, useQueryClient } from "@tanstack/react-query"
import { renameBot } from "./bots-api"
import {
  mutationErrorToast,
  mutationSuccessToast,
} from "@/shared/lib/mutation-toast"

interface RenameVars {
  userId: string
  nickname: string
}

/**
 * 봇 닉네임 변경(파티룸 노출명). 성공 시 로스터/풀 무효화. 닉네임 중복은 백엔드 409 → 에러 토스트.
 */
export function useRenameBot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, nickname }: RenameVars) => renameBot(userId, nickname),
    onSuccess: () => {
      mutationSuccessToast("닉네임을 변경했습니다.")
      qc.invalidateQueries({ queryKey: ["virtual-crew"] })
    },
    onError: mutationErrorToast,
  })
}
