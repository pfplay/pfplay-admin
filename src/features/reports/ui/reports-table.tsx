import { useNavigate } from "react-router-dom"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatKst } from "@/shared/lib/format-kst"
import type { AdminReportSummary, ReportStatus, ReportCategory } from "@/entities/report"

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
  rows: AdminReportSummary[]
  isLoading: boolean
  isEmpty: boolean
}

export function ReportsTable({ rows, isLoading, isEmpty }: Props) {
  const navigate = useNavigate()
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }
  if (isEmpty) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        조건에 맞는 신고가 없습니다
      </div>
    )
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>신고자</TableHead>
          <TableHead>카테고리</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>생성일</TableHead>
          <TableHead>검토자</TableHead>
          <TableHead>처리일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={row.reportId}
            className="cursor-pointer hover:bg-accent/50"
            onClick={() => navigate(`/reports/${row.reportId}`)}
          >
            <TableCell>{row.reportId}</TableCell>
            <TableCell>#{row.reporterUserAccountId}</TableCell>
            <TableCell>{CATEGORY_LABEL[row.category]}</TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>
            </TableCell>
            <TableCell>{formatKst(row.createdAt)}</TableCell>
            <TableCell>
              {row.reviewedByAdministratorId ?? "-"}
            </TableCell>
            <TableCell>{formatKst(row.resolvedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
