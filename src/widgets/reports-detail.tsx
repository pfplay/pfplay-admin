import { useParams, Link } from "react-router-dom"
import { useReportDetail } from "@/features/reports/api/use-report-detail"
import { ReportDetailCards } from "@/features/reports/ui/report-detail-cards"
import { ReportsActionsDropdown } from "@/features/reports/ui/reports-actions-dropdown"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/shared/api/error"

export function ReportsDetailWidget() {
  const { reportId } = useParams<{ reportId: string }>()
  const id = Number(reportId)
  const idValid = Number.isFinite(id) && id > 0
  const { data, isLoading, error } = useReportDetail(idValid ? id : 0)

  if (!idValid) return <NotFoundView />
  if (error instanceof ApiError && error.status === 404) return <NotFoundView />
  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }
  if (!data) return null

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-4">
        <Link to="/reports" className="text-sm text-muted-foreground inline-block">
          ← 목록으로
        </Link>
        <ReportsActionsDropdown reportId={data.reportId} currentStatus={data.status} />
      </div>
      <ReportDetailCards detail={data} />
    </div>
  )
}

function NotFoundView() {
  return (
    <div className="p-6 lg:p-8 text-center space-y-4">
      <h2 className="text-xl font-bold">신고를 찾을 수 없습니다</h2>
      <p className="text-muted-foreground text-sm">
        잘못된 ID이거나 삭제된 신고입니다.
      </p>
      <Link to="/reports">
        <Button variant="outline">목록으로</Button>
      </Link>
    </div>
  )
}
