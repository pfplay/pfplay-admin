import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { listReports } from "./reports-api"
import type { ReportsListQuery } from "../model/filter-schema"

export function useReportsList(query: ReportsListQuery) {
  return useQuery({
    queryKey: ["reports", "list", query],
    queryFn: () => listReports(query),
    placeholderData: keepPreviousData,
  })
}
