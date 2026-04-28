import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { listPartyrooms } from "./partyrooms-api"
import type { PartyroomsListQuery } from "../model/filter-schema"

export function usePartyroomsList(query: PartyroomsListQuery) {
  return useQuery({
    queryKey: ["partyrooms", "list", query],
    queryFn: () => listPartyrooms(query),
    placeholderData: keepPreviousData,
  })
}
