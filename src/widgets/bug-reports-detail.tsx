import { useParams, Link } from "react-router-dom"
import { useBugReportDetail } from "@/features/bug-reports/api/use-bug-report-detail"
import type { AdminBugReportDetail } from "@/entities/bug-report"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ApiError } from "@/shared/api/error"

const OWN_DOMAINS = ["pfplay.xyz", "admin.pfplay.xyz", "pfplay.kr"]

function renderPageUrl(url: string | null) {
  if (!url) return <span className="text-muted-foreground">—</span>
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return <span>{url}</span>
  }
  if (parsed.protocol !== "https:") return <span>{url}</span>
  if (OWN_DOMAINS.includes(parsed.hostname)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-primary"
      >
        {url}
      </a>
    )
  }
  return <span>{url}</span>
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("ko-KR")
}

interface CardsProps {
  detail: AdminBugReportDetail
}

function BugReportDetailCards({ detail }: CardsProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>작성자</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{detail.reporterEmail ?? "—"}</p>
          <p className="text-xs text-muted-foreground">
            uid: {detail.reporterUserAccountId}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>본문</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{detail.content}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>컨텍스트</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">페이지 URL: </span>
            {renderPageUrl(detail.pageUrl)}
          </div>
          <div>
            <span className="text-muted-foreground">User-Agent: </span>
            <span>{detail.userAgent ?? "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">
              파티룸 (사용자 신고 시점 주장값):{" "}
            </span>
            {detail.partyroomId ? (
              <Link
                to={`/partyrooms/${detail.partyroomId}`}
                className="underline text-primary"
              >
                {detail.partyroomName ?? `#${detail.partyroomId}`}
              </Link>
            ) : (
              "—"
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>메타</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>작성일: {formatDate(detail.createdAt)}</p>
        </CardContent>
      </Card>
    </div>
  )
}

export function BugReportsDetailWidget() {
  const { bugReportId } = useParams<{ bugReportId: string }>()
  const id = Number(bugReportId)
  const idValid = Number.isFinite(id) && id > 0
  const { data, isLoading, error } = useBugReportDetail(idValid ? id : 0)

  if (!idValid) return <NotFoundView />
  if (error instanceof ApiError && error.status === 404) return <NotFoundView />
  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }
  if (!data) return null

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-4">
        <Link
          to="/voc/bug-reports"
          className="text-sm text-muted-foreground inline-block"
        >
          ← 목록으로
        </Link>
      </div>
      <BugReportDetailCards detail={data} />
    </div>
  )
}

function NotFoundView() {
  return (
    <div className="p-6 lg:p-8">
      <h2 className="text-xl font-semibold text-muted-foreground mb-4">
        존재하지 않는 버그 리포트입니다
      </h2>
      <Button asChild variant="outline">
        <Link to="/voc/bug-reports">목록으로</Link>
      </Button>
    </div>
  )
}
