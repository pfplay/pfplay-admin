import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { listMembers } from "./members-api"
import type { MembersListQuery } from "../model/filter-schema"

export function useMembersList(query: MembersListQuery) {
  return useQuery({
    queryKey: ["members", "list", query],
    queryFn: () => listMembers(query),
    placeholderData: keepPreviousData,
  })
}
