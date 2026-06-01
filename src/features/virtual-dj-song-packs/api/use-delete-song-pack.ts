import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteSongPack } from "./song-packs-api"
import { mutationErrorToast } from "@/shared/lib/mutation-toast"

export function useDeleteSongPack() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteSongPack(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["virtual-dj", "song-packs"] })
    },
    onError: mutationErrorToast,
  })
}
