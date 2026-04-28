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
import type { AdminMemberSummary } from "@/entities/member"

interface Props {
  rows: AdminMemberSummary[]
  isLoading: boolean
  isEmpty: boolean
}

const TIER_LABEL: Record<string, string> = {
  FM: "FM",
  AM: "AM",
  GT: "GT (강등)",
}

function formatKst(iso: string | null): string {
  if (!iso) return "-"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleString("ko-KR", { hour12: false })
}

export function MembersTable({ rows, isLoading, isEmpty }: Props) {
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
        조건에 맞는 회원이 없습니다
      </div>
    )
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>이메일</TableHead>
          <TableHead>provider</TableHead>
          <TableHead>닉네임</TableHead>
          <TableHead>권한</TableHead>
          <TableHead>마지막 로그인</TableHead>
          <TableHead>가입일</TableHead>
          <TableHead>상태</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={row.memberId}
            className="cursor-pointer hover:bg-accent/50"
            onClick={() => navigate(`/members/${row.memberId}`)}
          >
            <TableCell>{row.memberId}</TableCell>
            <TableCell>{row.email}</TableCell>
            <TableCell>{row.providerType}</TableCell>
            <TableCell>{row.nickname ?? "-"}</TableCell>
            <TableCell>
              <Badge
                variant={row.authorityTier === "GT" ? "destructive" : "default"}
              >
                {TIER_LABEL[row.authorityTier] ?? row.authorityTier}
              </Badge>
            </TableCell>
            <TableCell>{formatKst(row.lastLoginAt)}</TableCell>
            <TableCell>{formatKst(row.createdAt)}</TableCell>
            <TableCell>
              {row.withdrawn ? (
                <Badge variant="secondary" title={row.withdrawnAt ?? ""}>
                  탈퇴
                </Badge>
              ) : (
                <Badge variant="outline">활동</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
