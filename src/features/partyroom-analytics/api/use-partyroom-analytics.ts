import { useQuery } from "@tanstack/react-query"
import { getPartyroomAnalytics } from "./analytics-api"

export function usePartyroomAnalytics(partyroomId: number, days: number) {
  return useQuery({
    queryKey: ["partyrooms", "analytics", partyroomId, days],
    queryFn: () => getPartyroomAnalytics(partyroomId, days),
    enabled: Number.isFinite(partyroomId) && partyroomId > 0,
  })
}
