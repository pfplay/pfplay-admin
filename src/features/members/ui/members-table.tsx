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
import { TIER } from "@/shared/lib/labels"
import type { AdminMemberSummary } from "@/entities/member"
import { formatKst } from "@/shared/lib/format-kst"

interface Props {
  rows: AdminMemberSummary[]
  isLoading: boolean
  isEmpty: boolean
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
              <Badge variant={TIER.variant[row.authorityTier]}>
                {TIER.label[row.authorityTier]}
              </Badge>
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
