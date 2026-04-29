import { useQuery } from "@tanstack/react-query"
import { getBody, getFace } from "./avatars-api"
import type {
  AdminAvatarBodyView,
  AdminAvatarFaceView,
  AvatarResourceType,
} from "@/entities/avatar"

interface Args {
  resourceType: AvatarResourceType
  id: number
}

export function useAvatarDetail(args: Args) {
  return useQuery<AdminAvatarBodyView | AdminAvatarFaceView>({
    queryKey: ["avatars", args.resourceType, "detail", args.id],
    queryFn: () =>
      args.resourceType === "body" ? getBody(args.id) : getFace(args.id),
    enabled: Number.isFinite(args.id) && args.id > 0,
  })
}
