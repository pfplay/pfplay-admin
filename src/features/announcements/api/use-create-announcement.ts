import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createAnnouncement } from "./announcements-api"
import { mutationErrorToast } from "@/shared/lib/mutation-toast"
import type { CreateAnnouncementRequest } from "../model/mutation-schema"

export function useCreateAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateAnnouncementRequest) => createAnnouncement(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] })
    },
    onError: mutationErrorToast,
  })
}
