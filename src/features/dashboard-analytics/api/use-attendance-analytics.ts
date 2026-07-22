import { useQuery } from "@tanstack/react-query"
import { getAttendanceAnalytics } from "./attendance-api"

export function useAttendanceAnalytics(days: number, excludeBots: boolean) {
  return useQuery({
    queryKey: ["dashboard", "attendance", days, excludeBots],
    queryFn: () => getAttendanceAnalytics(days, excludeBots),
  })
}
