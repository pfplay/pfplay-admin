import { AttendanceDashboard } from "@/features/dashboard-analytics/ui/attendance-dashboard"

export function DashboardPage() {
  return (
    <div className="space-y-6 p-8">
      <h2 className="text-2xl font-bold">대시보드</h2>
      <AttendanceDashboard />
    </div>
  )
}
