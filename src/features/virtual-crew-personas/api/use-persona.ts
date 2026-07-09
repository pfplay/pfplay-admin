import { useQuery } from "@tanstack/react-query"
import { getPersona } from "./personas-api"

export function usePersona(id: number, enabled = true) {
  return useQuery({
    queryKey: ["virtual-crew", "persona", id],
    queryFn: () => getPersona(id),
    enabled,
  })
}
