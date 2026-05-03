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
import { ADMIN_ROLE } from "@/shared/lib/labels"
import type { AdministratorView } from "@/entities/administrator"

interface Props {
  rows: AdministratorView[]
  isLoading: boolean
  isEmpty: boolean
}

export function AdministratorsTable({ rows, isLoading, isEmpty }: Props) {
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
        조건에 맞는 어드민이 없습니다
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>역할</TableHead>
          <TableHead>이메일</TableHead>
          <TableHead>닉네임</TableHead>
          <TableHead>비번 변경 필요</TableHead>
          <TableHead>최근 로그인</TableHead>
          <TableHead>권한 부여일</TableHead>
          <TableHead>상태</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={row.administratorId}
            className="cursor-pointer hover:bg-accent/50"
            onClick={() => navigate(`/administrators/${row.administratorId}`)}
          >
            <TableCell>{row.administratorId}</TableCell>
            <TableCell>
              <Badge variant={ADMIN_ROLE.variant[row.role]}>
                {ADMIN_ROLE.label[row.role]}
              </Badge>
            </TableCell>
            <TableCell>{row.email}</TableCell>
            <TableCell>{row.nickname ?? <span className="text-muted-foreground">—</span>}</TableCell>
            <TableCell>
              {row.mustChangePassword ? (
                <Badge variant="warning">필요</Badge>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>{formatKst(row.lastLoginAt)}</TableCell>
            <TableCell>{formatKst(row.grantedAt)}</TableCell>
            <TableCell>
              {row.revokedAt ? (
                <Badge variant="muted" title={`${formatKst(row.revokedAt)} 회수`}>
                  회수됨
                </Badge>
              ) : (
                <Badge variant="success">활성</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
