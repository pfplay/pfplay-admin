import { useQuery } from "@tanstack/react-query"
import { getReportDetail } from "./reports-api"

export function useReportDetail(reportId: number) {
  return useQuery({
    queryKey: ["reports", "detail", reportId],
    queryFn: () => getReportDetail(reportId),
    enabled: Number.isFinite(reportId) && reportId > 0,
  })
}
