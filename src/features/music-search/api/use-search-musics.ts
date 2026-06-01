import { useQuery } from "@tanstack/react-query"
import { searchMusics } from "./search-api"

export function useSearchMusics(q: string) {
  return useQuery({
    queryKey: ["music-search", q],
    queryFn: () => searchMusics(q),
    enabled: q.trim().length > 0,
  })
}
