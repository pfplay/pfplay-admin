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
import { isBodyView } from "@/entities/avatar"
import { LIFECYCLE_STATUS, OBTAINMENT_TYPE_LABEL } from "@/shared/lib/labels"
import type {
  AdminAvatarBodyView,
  AdminAvatarFaceView,
  AvatarResourceType,
} from "@/entities/avatar"

interface Props {
  resourceType: AvatarResourceType
  rows: (AdminAvatarBodyView | AdminAvatarFaceView)[]
  isLoading: boolean
  isEmpty: boolean
}

export function AvatarsTable({ resourceType, rows, isLoading, isEmpty }: Props) {
  const navigate = useNavigate()
  const isBody = resourceType === "body"

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )
  }
  if (isEmpty) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        조건에 맞는 아바타가 없습니다
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead className="w-20">아이콘</TableHead>
          <TableHead>이름</TableHead>
          <TableHead>획득</TableHead>
          {isBody && <TableHead>점수</TableHead>}
          {isBody && <TableHead>합성 가능</TableHead>}
          <TableHead>상태</TableHead>
          <TableHead>생성일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={row.id}
            className="cursor-pointer hover:bg-accent/50"
            onClick={() => navigate(`/avatars/${resourceType === "body" ? "bodies" : "faces"}/${row.id}`)}
          >
            <TableCell>{row.id}</TableCell>
            <TableCell>
              {row.iconUri ? (
                <img
                  src={row.iconUri}
                  alt={row.name}
                  className="w-12 h-12 object-contain rounded border"
                  loading="lazy"
                />
              ) : (
                <span
                  aria-label="아이콘 없음"
                  className="text-muted-foreground"
                >
                  —
                </span>
              )}
            </TableCell>
            <TableCell>{row.name}</TableCell>
            <TableCell>{OBTAINMENT_TYPE_LABEL[row.obtainableType] ?? row.obtainableType}</TableCell>
            {isBodyView(row) && <TableCell>{row.obtainableScore}</TableCell>}
            {isBodyView(row) && (
              <TableCell>{row.isCombinable ? "✓" : "—"}</TableCell>
            )}
            <TableCell>
              <Badge variant={LIFECYCLE_STATUS.variant[row.lifecycleStatus]}>
                {LIFECYCLE_STATUS.label[row.lifecycleStatus]}
              </Badge>
            </TableCell>
            <TableCell>{formatKst(row.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
