import { useMutation, useQueryClient } from "@tanstack/react-query"
import { addTrack } from "./song-packs-api"
import { mutationErrorToast } from "@/shared/lib/mutation-toast"
import { addTrackSchema, type AddTrackRequest } from "../model/song-pack-schema"

export function useAddTrack(packId: number) {
  const qc = useQueryClient()
  return useMutation({
    // 백엔드 AddPackTrackRequest 제약(name≤200·linkId≤100·duration 필수 등)을 전송 직전 강제한다.
    // music-search 매퍼 결과가 경계를 넘으면 네트워크 전에 차단(백엔드 400 선반영).
    mutationFn: (body: AddTrackRequest) => addTrack(packId, addTrackSchema.parse(body)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["virtual-crew", "song-pack", packId] })
      qc.invalidateQueries({ queryKey: ["virtual-crew", "song-packs"] })
    },
    onError: mutationErrorToast,
  })
}
