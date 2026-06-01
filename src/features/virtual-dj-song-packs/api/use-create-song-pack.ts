import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createSongPack } from "./song-packs-api"
import { mutationErrorToast } from "@/shared/lib/mutation-toast"
import type { CreateSongPackRequest } from "../model/song-pack-schema"

export function useCreateSongPack() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateSongPackRequest) => createSongPack(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["virtual-dj", "song-packs"] })
    },
    onError: mutationErrorToast,
  })
}
