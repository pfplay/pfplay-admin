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
import { Checkbox } from "@/components/ui/checkbox"
import {
  PARTYROOM_STATUS,
  STAGE_TYPE,
  DISPLAY_FLAG_LABEL,
  DISPLAY_FLAG_VARIANT,
  VIRTUAL_DJ_STATUS,
} from "@/shared/lib/labels"
import { formatKst } from "@/shared/lib/format-kst"
import type { AdminPartyroomListItem, PartyroomStatus } from "@/entities/partyroom"

interface Props {
  rows: AdminPartyroomListItem[]
  isLoading: boolean
  isEmpty: boolean
  /** selection mode props — 모두 함께 제공되어야 selection column 활성화 */
  selectedIds?: Set<number>
  onToggleId?: (id: number) => void
  onToggleAll?: (checked: boolean) => void
}

export function PartyroomsTable({
  rows,
  isLoading,
  isEmpty,
  selectedIds,
  onToggleId,
  onToggleAll,
}: Props) {
  const navigate = useNavigate()
  const selectionEnabled =
    selectedIds !== undefined && onToggleId !== undefined && onToggleAll !== undefined
  const headerState: boolean | "indeterminate" = selectionEnabled
    ? selectedIds.size === 0
      ? false
      : selectedIds.size === rows.length
        ? true
        : "indeterminate"
    : false
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
          {selectionEnabled && (
            <TableHead className="w-10">
              <Checkbox
                aria-label="전체 선택"
                checked={headerState}
                onCheckedChange={(c) => onToggleAll!(c === true)}
              />
            </TableHead>
          )}
          <TableHead>ID</TableHead>
          <TableHead>제목</TableHead>
          <TableHead>스테이지</TableHead>
          <TableHead>호스트</TableHead>
          <TableHead>크루</TableHead>
          <TableHead>DJ</TableHead>
          <TableHead>가상 DJ</TableHead>
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
            {selectionEnabled && (
              <TableCell
                className="w-10"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  aria-label={`${row.title} 선택`}
                  checked={selectedIds!.has(row.partyroomId)}
                  onCheckedChange={() => onToggleId!(row.partyroomId)}
                />
              </TableCell>
            )}
            <TableCell>{row.partyroomId}</TableCell>
            <TableCell>{row.title}</TableCell>
            <TableCell>
              <Badge variant={STAGE_TYPE.variant[row.stageType] ?? "outline"}>
                {STAGE_TYPE.label[row.stageType] ?? row.stageType}
              </Badge>
            </TableCell>
            <TableCell>
              {row.hostNickname ?? `#${row.hostUserAccountId}`}
            </TableCell>
            <TableCell>{row.crewCount}</TableCell>
            <TableCell>{row.djCount}</TableCell>
            <TableCell>
              {row.virtualDj ? (
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <Badge variant={VIRTUAL_DJ_STATUS.variant[row.virtualDj.status]}>
                    {VIRTUAL_DJ_STATUS.label[row.virtualDj.status]}
                  </Badge>
                  <span className="text-muted-foreground">
                    봇 {row.virtualDj.botDjCount}/{row.virtualDj.targetCount ?? "—"}
                  </span>
                </span>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell>{row.playbackActivated ? "ON" : "OFF"}</TableCell>
            <TableCell>
              <Badge
                variant={
                  PARTYROOM_STATUS.variant[row.status as PartyroomStatus] ??
                  "outline"
                }
              >
                {PARTYROOM_STATUS.label[row.status as PartyroomStatus] ?? row.status}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={DISPLAY_FLAG_VARIANT[row.displayFlag] ?? "outline"}>
                {DISPLAY_FLAG_LABEL[row.displayFlag] ?? row.displayFlag}
              </Badge>
            </TableCell>
            <TableCell>{formatKst(row.createdAt)}</TableCell>
            <TableCell>{formatKst(row.lastActivityAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
