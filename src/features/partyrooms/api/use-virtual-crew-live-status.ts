import { useQuery } from "@tanstack/react-query"
import { getLiveStatus } from "./virtual-crew-room-api"

export function useVirtualCrewLiveStatus(id: number, enabled = true) {
  return useQuery({
    queryKey: ["virtual-crew", "room", id],
    queryFn: () => getLiveStatus(id),
    enabled: enabled && Number.isFinite(id) && id > 0,
  })
}
