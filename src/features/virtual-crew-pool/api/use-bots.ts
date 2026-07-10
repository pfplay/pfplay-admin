import { useQuery } from "@tanstack/react-query"
import { getBots } from "./bots-api"

export function useBots() {
  return useQuery({
    queryKey: ["virtual-crew", "bots"],
    queryFn: getBots,
  })
}
