import { useQuery } from "@tanstack/react-query"
import { listBodies, listFaces } from "./avatars-api"
import type { BodyListQuery, FaceListQuery } from "../model/filter-schema"
import type {
  AdminAvatarBodyView,
  AdminAvatarFaceView,
} from "@/entities/avatar"

type Args =
  | { resourceType: "body"; query: BodyListQuery }
  | { resourceType: "face"; query: FaceListQuery }

export function useAvatarsList(
  args: Args,
): ReturnType<typeof useQuery<AdminAvatarBodyView[] | AdminAvatarFaceView[]>> {
  return useQuery({
    queryKey: ["avatars", args.resourceType, "list", args.query],
    queryFn: () =>
      args.resourceType === "body"
        ? listBodies(args.query)
        : listFaces(args.query),
  })
}
