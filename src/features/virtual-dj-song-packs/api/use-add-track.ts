import { useMutation, useQueryClient } from "@tanstack/react-query"
import { addTrack } from "./song-packs-api"
import { mutationErrorToast } from "@/shared/lib/mutation-toast"
import type { AddTrackRequest } from "../model/song-pack-schema"

export function useAddTrack(packId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: AddTrackRequest) => addTrack(packId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["virtual-dj", "song-pack", packId] })
      qc.invalidateQueries({ queryKey: ["virtual-dj", "song-packs"] })
    },
    onError: mutationErrorToast,
  })
}
