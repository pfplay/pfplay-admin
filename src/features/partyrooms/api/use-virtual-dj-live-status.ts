import { useQuery } from "@tanstack/react-query"
import { getLiveStatus } from "./virtual-dj-room-api"

export function useVirtualDjLiveStatus(id: number, enabled = true) {
  return useQuery({
    queryKey: ["virtual-dj", "room", id],
    queryFn: () => getLiveStatus(id),
    enabled: enabled && Number.isFinite(id) && id > 0,
  })
}
