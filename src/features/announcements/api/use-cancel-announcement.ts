import { useMutation, useQueryClient } from "@tanstack/react-query"
import { cancelAnnouncement } from "./announcements-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"

export function useCancelAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => cancelAnnouncement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] })
      mutationSuccessToast("공지를 취소했습니다")
    },
    onError: mutationErrorToast,
  })
}
