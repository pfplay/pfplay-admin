import { useMutation, useQueryClient } from "@tanstack/react-query"
import { publishBody, publishFace } from "./avatars-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"
import type { AvatarResourceType } from "@/entities/avatar"

export function usePublishAvatar(resourceType: AvatarResourceType) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      resourceType === "body" ? publishBody(id) : publishFace(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["avatars", resourceType] })
      mutationSuccessToast(
        resourceType === "body" ? "Body 게시 완료" : "Face 게시 완료",
      )
    },
    onError: mutationErrorToast,
  })
}
