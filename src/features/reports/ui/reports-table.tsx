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
import { REPORT_STATUS, REPORT_CATEGORY_LABEL } from "@/shared/lib/labels"
import type { AdminReportSummary } from "@/entities/report"

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
            <TableCell>{REPORT_CATEGORY_LABEL[row.category]}</TableCell>
            <TableCell>
              <Badge variant={REPORT_STATUS.variant[row.status]}>
                {REPORT_STATUS.label[row.status]}
              </Badge>
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
