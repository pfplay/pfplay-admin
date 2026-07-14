import { useMutation, useQueryClient } from "@tanstack/react-query"
import { removeBots } from "./bots-api"
import {
  mutationErrorToast,
  mutationSuccessToast,
} from "@/shared/lib/mutation-toast"

/**
 * 봇 일괄 제거(탈퇴 soft-delete). 성공 시 봇 로스터/풀 요약 무효화 + 크루 배치 화면 동기화.
 * 배치된 봇이 포함되면 백엔드가 409(BOT_PLACED_CANNOT_REMOVE) → 에러 토스트.
 */
export function useRemoveBots() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (botUserIds: number[]) => removeBots(botUserIds),
    onSuccess: (result) => {
      mutationSuccessToast(`봇 ${result.removed}명을 제거했습니다.`)
      qc.invalidateQueries({ queryKey: ["virtual-crew"] })
    },
    onError: mutationErrorToast,
  })
}
