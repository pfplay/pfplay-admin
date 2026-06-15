import { useQuery } from "@tanstack/react-query"
import { getPoolSummary } from "./pool-api"

export function usePoolSummary() {
  return useQuery({
    queryKey: ["virtual-dj", "pool"],
    queryFn: getPoolSummary,
  })
}
