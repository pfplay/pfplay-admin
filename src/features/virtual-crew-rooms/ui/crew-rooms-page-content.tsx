import { useState } from "react"
import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { usePartyroomsList } from "@/features/partyrooms/api/use-partyrooms-list"
import { useReplaceVirtualCrew } from "@/features/partyrooms/api/use-replace-virtual-crew"
import { useDrainResourcesVirtualCrew } from "@/features/partyrooms/api/use-drain-resources-virtual-crew"
import { VirtualCrewBulkDialog } from "@/features/partyrooms/ui/mutation-dialogs/virtual-crew-bulk-dialog"
import type { PartyroomsListQuery } from "@/features/partyrooms/model/filter-schema"
import type { AdminPartyroomListItem } from "@/entities/partyroom"
import { VIRTUAL_CREW_STATUS } from "@/shared/lib/labels"

// 안정된 참조(매 렌더 새 객체면 queryKey 변동 → refetch 루프) — 모듈 상수.
const ROOMS_QUERY: PartyroomsListQuery = { page: 0, size: 100, sort: "createdAt,desc" }

function CrewRoomRow({
  room,
  selected,
  onToggle,
}: {
  room: AdminPartyroomListItem
  selected: boolean
  onToggle: () => void
}) {
  const vc = room.virtualCrew
  const replace = useReplaceVirtualCrew(room.partyroomId)
  const drainResources = useDrainResourcesVirtualCrew(room.partyroomId)
  const managed = vc?.status === "MANAGED"

  return (
    <TableRow>
      <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          aria-label={`${room.title} 선택`}
          checked={selected}
          onCheckedChange={onToggle}
        />
      </TableCell>
      <TableCell>{room.partyroomId}</TableCell>
      <TableCell className="max-w-[220px] truncate">{room.title}</TableCell>
      <TableCell>
        {vc ? (
          <Badge variant={VIRTUAL_CREW_STATUS.variant[vc.status]}>
            {VIRTUAL_CREW_STATUS.label[vc.status]}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>{vc?.targetCount ?? "—"}</TableCell>
      <TableCell>{vc ? vc.botDjCount : "—"}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            disabled={!managed || replace.isPending}
            onClick={() => replace.mutate()}
            title="봇 전원 회수 후 현재 설정·송팩 기준 재배치"
          >
            재배치
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!managed || drainResources.isPending}
            onClick={() => drainResources.mutate()}
            title="봇 제거하되 운영(운영중) 상태는 유지 — 이후 부활/재배치 가능"
          >
            리소스 회수
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link to={`/partyrooms/${room.partyroomId}`} className="gap-1">
              상세 설정 <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function CrewRoomsPageContent() {
  const { data, isLoading, isError } = usePartyroomsList(ROOMS_QUERY)
  const rooms = data?.content ?? []
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="p-6">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">크루 배치 & 운영</h1>
        <Button
          size="sm"
          disabled={selected.size === 0}
          onClick={() => setBulkOpen(true)}
        >
          선택 방 설정/적용 ({selected.size})
        </Button>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        방을 선택해 총원/DJ/송팩을 일괄 설정·적용하거나, 방별로 재배치·드레인하세요. 상세 설정은 각 방
        상세로 이동합니다.
      </p>

      {isError ? (
        <p className="rounded-lg border border-border p-6 text-center text-muted-foreground">
          파티룸 목록을 불러오지 못했습니다.
        </p>
      ) : isLoading ? (
        <p className="p-6 text-center text-muted-foreground">불러오는 중…</p>
      ) : rooms.length === 0 ? (
        <p className="p-6 text-center text-muted-foreground">파티룸이 없습니다.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>ID</TableHead>
              <TableHead>제목</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>총원</TableHead>
              <TableHead>DJ</TableHead>
              <TableHead>운영</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map((room) => (
              <CrewRoomRow
                key={room.partyroomId}
                room={room}
                selected={selected.has(room.partyroomId)}
                onToggle={() => toggle(room.partyroomId)}
              />
            ))}
          </TableBody>
        </Table>
      )}

      <VirtualCrewBulkDialog
        selectedIds={[...selected]}
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onSuccess={() => setSelected(new Set())}
      />
    </div>
  )
}
