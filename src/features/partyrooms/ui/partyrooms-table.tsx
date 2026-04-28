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
import type { AdminPartyroomListItem } from "@/entities/partyroom"

interface Props {
  rows: AdminPartyroomListItem[]
  isLoading: boolean
  isEmpty: boolean
}

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  ACTIVE: "default",
  SUSPENDED: "secondary",
  TERMINATED: "destructive",
}

function formatKst(iso: string | null): string {
  if (!iso) return "-"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleString("ko-KR", { hour12: false })
}

export function PartyroomsTable({ rows, isLoading, isEmpty }: Props) {
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
        조건에 맞는 파티룸이 없습니다
      </div>
    )
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>제목</TableHead>
          <TableHead>스테이지</TableHead>
          <TableHead>호스트</TableHead>
          <TableHead>크루</TableHead>
          <TableHead>DJ</TableHead>
          <TableHead>재생</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>표시</TableHead>
          <TableHead>생성일</TableHead>
          <TableHead>마지막 활동</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={row.partyroomId}
            className="cursor-pointer hover:bg-accent/50"
            onClick={() => navigate(`/partyrooms/${row.partyroomId}`)}
          >
            <TableCell>{row.partyroomId}</TableCell>
            <TableCell>{row.title}</TableCell>
            <TableCell>{row.stageType}</TableCell>
            <TableCell>
              {row.hostNickname ?? `#${row.hostUserAccountId}`}
            </TableCell>
            <TableCell>{row.crewCount}</TableCell>
            <TableCell>{row.djCount}</TableCell>
            <TableCell>{row.playbackActivated ? "ON" : "OFF"}</TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[row.status] ?? "outline"}>
                {row.status}
              </Badge>
            </TableCell>
            <TableCell>{row.displayFlag}</TableCell>
            <TableCell>{formatKst(row.createdAt)}</TableCell>
            <TableCell>{formatKst(row.lastActivityAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
