import { useMutation, useQueryClient } from "@tanstack/react-query"
import { removeTrack } from "./song-packs-api"
import { mutationErrorToast } from "@/shared/lib/mutation-toast"

export function useRemoveTrack(packId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (trackId: number) => removeTrack(packId, trackId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["virtual-dj", "song-pack", packId] })
      qc.invalidateQueries({ queryKey: ["virtual-dj", "song-packs"] })
    },
    onError: mutationErrorToast,
  })
}
