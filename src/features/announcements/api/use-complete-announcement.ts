import { useMutation, useQueryClient } from "@tanstack/react-query"
import { completeAnnouncement } from "./announcements-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"

export function useCompleteAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => completeAnnouncement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] })
      mutationSuccessToast("점검을 정상 종료했습니다")
    },
    onError: mutationErrorToast,
  })
}
