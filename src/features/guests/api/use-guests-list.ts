import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { listGuests } from "./guests-api"
import type { GuestsListQuery } from "../model/filter-schema"

export function useGuestsList(query: GuestsListQuery) {
  return useQuery({
    queryKey: ["admin", "guests", query],
    queryFn: () => listGuests(query),
    staleTime: 30_000,
    // Chunk 2 reviewer follow-up: 페이지 전환 시 깜빡임 방지 (useMembersList parity)
    placeholderData: keepPreviousData,
  })
}
