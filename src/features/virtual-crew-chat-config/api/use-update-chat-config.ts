import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateChatConfig } from "./chat-config-api"
import {
  mutationSuccessToast,
  mutationErrorToast,
} from "@/shared/lib/mutation-toast"

export function useUpdateChatConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateChatConfig,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["virtual-crew", "chat-config"] })
      mutationSuccessToast("채팅 설정을 저장했습니다")
    },
    onError: mutationErrorToast,
  })
}
