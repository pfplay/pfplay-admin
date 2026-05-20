import { useQuery } from "@tanstack/react-query"
import { listGuests } from "./guests-api"
import type { GuestsListQuery } from "../model/filter-schema"

export function useGuestsList(query: GuestsListQuery) {
  return useQuery({
    queryKey: ["admin", "guests", query],
    queryFn: () => listGuests(query),
    staleTime: 30_000,
  })
}
