import { http } from "@/shared/api/http"
import type { AttendanceAnalyticsResponse } from "../model/types"

export async function getAttendanceAnalytics(
  days: number,
  excludeBots: boolean,
): Promise<AttendanceAnalyticsResponse> {
  return http<AttendanceAnalyticsResponse>(
    `/api/v1/admin/analytics/attendance?days=${days}&excludeBots=${excludeBots}`,
  )
}
