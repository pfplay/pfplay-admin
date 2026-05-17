import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatKst } from "@/shared/lib/format-kst"
import {
  ANNOUNCEMENT_TYPE,
  ANNOUNCEMENT_SEVERITY,
  ANNOUNCEMENT_DERIVED_STATUS,
  deriveAnnouncementStatus,
} from "@/shared/lib/labels"
import type { Announcement } from "@/entities/announcement"

interface Props {
  rows: Announcement[]
  isLoading: boolean
  isEmpty: boolean
  onCancelClick: (announcement: Announcement) => void
  onAdjustClick?: (announcement: Announcement) => void
  onCompleteClick?: (announcement: Announcement) => void
}

export function AnnouncementsTable({
  rows,
  isLoading,
  isEmpty,
  onCancelClick,
  onAdjustClick,
  onCompleteClick,
}: Props) {
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
        송출된 공지가 없습니다
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>종류</TableHead>
          <TableHead>심각도</TableHead>
          <TableHead>제목</TableHead>
          <TableHead>송출 시각</TableHead>
          <TableHead>상태</TableHead>
          <TableHead className="text-right">작업</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const status = deriveAnnouncementStatus(row)
          return (
            <TableRow key={row.id}>
              <TableCell className="font-mono text-sm">#{row.id}</TableCell>
              <TableCell>
                <Badge variant={ANNOUNCEMENT_TYPE.variant[row.type]}>
                  {ANNOUNCEMENT_TYPE.label[row.type]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={ANNOUNCEMENT_SEVERITY.variant[row.severity]}>
                  {ANNOUNCEMENT_SEVERITY.label[row.severity]}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs">
                <div className="truncate font-medium" title={row.titleKo}>
                  {row.titleKo}
                </div>
                <div className="truncate text-xs text-muted-foreground" title={row.titleEn}>
                  {row.titleEn}
                </div>
              </TableCell>
              <TableCell>{formatKst(row.sentAt)}</TableCell>
              <TableCell>
                <Badge variant={ANNOUNCEMENT_DERIVED_STATUS.variant[status]}>
                  {ANNOUNCEMENT_DERIVED_STATUS.label[status]}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {status === "ACTIVE" && (
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAdjustClick?.(row)}
                      aria-label={`공지 #${row.id} 종료시각 조정`}
                    >
                      종료시각 조정
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCompleteClick?.(row)}
                      aria-label={`공지 #${row.id} 지금 종료`}
                    >
                      지금 종료
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCancelClick(row)}
                      aria-label={`공지 #${row.id} 철회`}
                    >
                      철회
                    </Button>
                  </div>
                )}
                {(status === "PLANNED" || status === "SENT") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCancelClick(row)}
                    aria-label={`공지 #${row.id} 철회`}
                  >
                    철회
                  </Button>
                )}
                {(status === "COMPLETED" || status === "CANCELLED") && (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
