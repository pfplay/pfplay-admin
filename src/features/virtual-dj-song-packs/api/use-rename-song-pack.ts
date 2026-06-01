import { useMutation, useQueryClient } from "@tanstack/react-query"
import { renameSongPack } from "./song-packs-api"
import { mutationErrorToast } from "@/shared/lib/mutation-toast"
import type { RenameSongPackRequest } from "../model/song-pack-schema"

export function useRenameSongPack() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: RenameSongPackRequest }) =>
      renameSongPack(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["virtual-dj", "song-packs"] })
    },
    onError: mutationErrorToast,
  })
}
