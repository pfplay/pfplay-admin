import { useQuery } from "@tanstack/react-query"
import { getBugReportDetail } from "./bug-reports-api"

export function useBugReportDetail(bugReportId: number) {
  return useQuery({
    queryKey: ["admin", "bug-reports", bugReportId, "detail"],
    queryFn: () => getBugReportDetail(bugReportId),
    staleTime: 30_000,
    enabled: bugReportId > 0,
  })
}
