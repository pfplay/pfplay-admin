import { useMutation, useQueryClient } from "@tanstack/react-query"
import { adjustAnnouncementSchedule } from "./announcements-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"

export function useAdjustSchedule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, scheduledEndAt }: { id: number; scheduledEndAt: string }) =>
      adjustAnnouncementSchedule(id, scheduledEndAt),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] })
      mutationSuccessToast("종료 시각을 조정했습니다")
    },
    onError: mutationErrorToast,
  })
}
