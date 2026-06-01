import { useQuery } from "@tanstack/react-query"
import { getSongPack } from "./song-packs-api"

export function useSongPackDetail(id: number) {
  return useQuery({
    queryKey: ["virtual-dj", "song-pack", id],
    queryFn: () => getSongPack(id),
  })
}
