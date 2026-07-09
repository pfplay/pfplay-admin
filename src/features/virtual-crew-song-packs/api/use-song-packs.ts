import { useQuery } from "@tanstack/react-query"
import { listSongPacks } from "./song-packs-api"

export function useSongPacks() {
  return useQuery({
    queryKey: ["virtual-crew", "song-packs"],
    queryFn: listSongPacks,
  })
}
