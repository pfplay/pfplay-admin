import { useQuery } from "@tanstack/react-query"
import { getBots } from "./bots-api"

export function useBots() {
  return useQuery({
    queryKey: ["virtual-dj", "bots"],
    queryFn: getBots,
  })
}
