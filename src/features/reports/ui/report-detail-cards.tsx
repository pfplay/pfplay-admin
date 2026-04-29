import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatKst } from "@/shared/lib/format-kst"
import type {
  AdminReportDetail,
  ReportStatus,
  ReportCategory,
} from "@/entities/report"

const STATUS_VARIANT: Record<ReportStatus, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  REVIEWING: "default",
  RESOLVED: "outline",
  DISMISSED: "destructive",
}

const CATEGORY_LABEL: Record<ReportCategory, string> = {
  INAPPROPRIATE_CONTENT: "부적절 컨텐츠",
  HARASSMENT: "괴롭힘",
  SPAM: "스팸",
  COPYRIGHT: "저작권",
  OTHER: "기타",
}

interface Props {
  detail: AdminReportDetail
}

export function ReportDetailCards({ detail }: Props) {
  const reporterMissing =
    detail.reporter.email === null && detail.reporter.nickname === null
  const partyroomMissing =
    detail.partyroom.title === null && detail.partyroom.host === null

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            신고 #{detail.reportId}
            <Badge variant={STATUS_VARIANT[detail.status]}>{detail.status}</Badge>
            <Badge variant="outline">{CATEGORY_LABEL[detail.category]}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          접수일: {formatKst(detail.createdAt)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>신고자</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          {reporterMissing ? (
            <p className="text-muted-foreground">(삭제된 회원)</p>
          ) : (
            <>
              <p>userAccountId: {detail.reporter.userAccountId}</p>
              <p>email: {detail.reporter.email ?? "(N/A)"}</p>
              <p>nickname: {detail.reporter.nickname ?? "(N/A)"}</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>파티룸</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          {partyroomMissing ? (
            <p className="text-muted-foreground">
              (삭제된 파티룸 — id: {detail.partyroom.partyroomId})
            </p>
          ) : (
            <>
              <p>
                #{detail.partyroom.partyroomId}{" "}
                <Link
                  to={`/partyrooms/${detail.partyroom.partyroomId}`}
                  className="text-primary underline"
                >
                  파티룸 상세
                </Link>
              </p>
              <p>title: {detail.partyroom.title ?? "(N/A)"}</p>
              <p>
                host: {detail.partyroom.host?.nickname ?? "(N/A)"}{" "}
                {detail.partyroom.host && (
                  <span className="text-muted-foreground">
                    (#{detail.partyroom.host.userAccountId})
                  </span>
                )}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>신고 내용</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{detail.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>검토</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          {detail.review.reviewedByAdministratorId === null ? (
            <p className="text-muted-foreground">검토 전</p>
          ) : (
            <>
              <p>검토자: #{detail.review.reviewedByAdministratorId}</p>
              <p>
                처리 메모:{" "}
                {detail.review.resolutionNote ?? (
                  <span className="text-muted-foreground">(없음)</span>
                )}
              </p>
              <p>처리일: {formatKst(detail.review.resolvedAt)}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
