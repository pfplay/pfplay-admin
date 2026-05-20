import { useNavigate } from "react-router-dom"
import type { AdminBugReportSummary } from "@/entities/bug-report"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Props {
  rows: AdminBugReportSummary[]
  isLoading: boolean
  isEmpty: boolean
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("ko-KR")
}

export function BugReportsTable({ rows, isLoading, isEmpty }: Props) {
  const navigate = useNavigate()

  if (isLoading) {
    return <p className="text-muted-foreground py-4">불러오는 중...</p>
  }
  if (isEmpty) {
    return <p className="text-muted-foreground py-4">조회 결과가 없습니다</p>
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[220px]">작성자</TableHead>
          <TableHead>본문</TableHead>
          <TableHead className="w-[120px]">파티룸 ID</TableHead>
          <TableHead className="w-[180px]">작성일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={row.bugReportId}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => navigate(`/voc/bug-reports/${row.bugReportId}`)}
            data-testid="bug-report-row"
          >
            <TableCell>
              <div className="flex flex-col">
                <span className="text-sm">{row.reporterEmail ?? "—"}</span>
                <span className="text-xs text-muted-foreground">
                  uid: {row.reporterUserAccountId}
                </span>
              </div>
            </TableCell>
            <TableCell className="max-w-[400px] truncate">
              {row.contentPreview}
            </TableCell>
            <TableCell>{row.partyroomId ?? "—"}</TableCell>
            <TableCell>{formatDate(row.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
