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
import type { AdminGuestSummary } from "@/entities/guest"
import { formatKst } from "@/shared/lib/format-kst"

interface Props {
  rows: AdminGuestSummary[]
  isLoading: boolean
  isEmpty: boolean
}

export function GuestsTable({ rows, isLoading, isEmpty }: Props) {
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
        조건에 맞는 게스트가 없습니다
      </div>
    )
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>이메일</TableHead>
          <TableHead>가입 경로</TableHead>
          <TableHead>닉네임</TableHead>
          <TableHead>agent</TableHead>
          <TableHead>마지막 로그인</TableHead>
          <TableHead>가입일</TableHead>
          <TableHead>상태</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={row.guestId}
            className="cursor-pointer hover:bg-accent/50"
            onClick={() => navigate(`/guests/${row.guestId}`)}
          >
            <TableCell>{row.guestId}</TableCell>
            <TableCell>{row.email}</TableCell>
            <TableCell>{row.providerType}</TableCell>
            <TableCell>{row.nickname ?? "-"}</TableCell>
            <TableCell
              className="max-w-[16rem] truncate"
              title={row.agent ?? ""}
            >
              {row.agent ?? "-"}
            </TableCell>
            <TableCell>{formatKst(row.lastLoginAt)}</TableCell>
            <TableCell>{formatKst(row.createdAt)}</TableCell>
            <TableCell>
              {row.withdrawn ? (
                <Badge variant="muted" title={row.withdrawnAt ?? ""}>
                  탈퇴됨
                </Badge>
              ) : (
                <Badge variant="outline">활동 중</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
