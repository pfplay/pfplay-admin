import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { getPartyroomDjHistory } from "./analytics-api"

export function usePartyroomDjHistory(
  partyroomId: number,
  page: number,
  size = 10,
) {
  return useQuery({
    queryKey: ["partyrooms", "dj-history", partyroomId, page, size],
    queryFn: () => getPartyroomDjHistory(partyroomId, page, size),
    enabled: Number.isFinite(partyroomId) && partyroomId > 0,
    placeholderData: keepPreviousData,
  })
}
