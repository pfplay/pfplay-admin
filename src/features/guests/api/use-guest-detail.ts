import { useQuery } from "@tanstack/react-query"
import { getGuestDetail } from "./guests-api"

export function useGuestDetail(guestId: number) {
  return useQuery({
    queryKey: ["admin", "guests", guestId, "detail"],
    queryFn: () => getGuestDetail(guestId),
    staleTime: 30_000,
  })
}
