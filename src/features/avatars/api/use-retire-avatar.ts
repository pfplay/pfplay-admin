import { useMutation, useQueryClient } from "@tanstack/react-query"
import { retireBody, retireFace } from "./avatars-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"
import type { AvatarResourceType } from "@/entities/avatar"
import type { RetireAvatarRequest } from "../model/retire-schema"

export function useRetireAvatar(resourceType: AvatarResourceType) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: number; body: RetireAvatarRequest }) =>
      resourceType === "body"
        ? retireBody(vars.id, vars.body)
        : retireFace(vars.id, vars.body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["avatars", resourceType] })
      mutationSuccessToast(
        resourceType === "body" ? "Body 회수 완료" : "Face 회수 완료",
      )
    },
    onError: mutationErrorToast,
  })
}
