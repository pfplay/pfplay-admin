import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { listBugReports } from "./bug-reports-api"
import type { BugReportsListQuery } from "../model/filter-schema"

export function useBugReportsList(query: BugReportsListQuery) {
  return useQuery({
    queryKey: ["admin", "bug-reports", query],
    queryFn: () => listBugReports(query),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })
}
