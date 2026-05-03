import { useQuery } from "@tanstack/react-query"
import { getPartyroomDetail } from "./partyrooms-api"

export function usePartyroomDetail(partyroomId: number) {
  return useQuery({
    queryKey: ["partyrooms", "detail", partyroomId],
    queryFn: () => getPartyroomDetail(partyroomId),
    enabled: Number.isFinite(partyroomId) && partyroomId > 0,
  })
}
