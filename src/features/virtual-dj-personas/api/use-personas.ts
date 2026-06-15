import { useQuery } from "@tanstack/react-query"
import { listPersonas } from "./personas-api"

export function usePersonas() {
  return useQuery({
    queryKey: ["virtual-dj", "personas"],
    queryFn: listPersonas,
  })
}
