import { useQuery } from "@tanstack/react-query"
import { getMemberDetail } from "./members-api"

export function useMemberDetail(memberId: number) {
  return useQuery({
    queryKey: ["members", "detail", memberId],
    queryFn: () => getMemberDetail(memberId),
    enabled: Number.isFinite(memberId) && memberId > 0,
  })
}
