import { useState } from "react"
import { useDialogResetEffect } from "@/shared/lib/use-dialog-reset-effect"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useBulkVirtualCrew } from "@/features/partyrooms/api/use-bulk-virtual-crew"
import {
  VirtualCrewBulkSchema,
  type VirtualCrewBulkRequest,
} from "@/features/partyrooms/model/virtual-crew-bulk-schema"
import { useSongPacks } from "@/features/virtual-crew-song-packs/api/use-song-packs"
import { VIRTUAL_CREW_STATUS } from "@/shared/lib/labels"
import type { VirtualCrewStatus } from "@/entities/virtual-crew"

const STATUS_OPTIONS: VirtualCrewStatus[] = ["OFF", "MANAGED"]

interface Props {
  selectedIds: number[]
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 성공 시 widget 이 selection clear 분기 (204 — per-room 결과 없음) */
  onSuccess?: () => void
}

// 빈 문자열/숫자 입력을 number|null 로 정규화
function parseNum(v: string): number | null {
  const t = v.trim()
  if (t === "") return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

export function VirtualCrewBulkDialog({
  selectedIds,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [status, setStatus] = useState<VirtualCrewStatus>("OFF")
  const [targetCount, setTargetCount] = useState("")
  const [djBotCount, setDjBotCount] = useState("")
  const [songPackId, setSongPackId] = useState<string>("") // "" = 없음
  const mutation = useBulkVirtualCrew()
  const { data: songPacks } = useSongPacks()

  useDialogResetEffect(open, () => {
    setStatus("OFF")
    setTargetCount("")
    setDjBotCount("")
    setSongPackId("")
    mutation.reset()
  })

  const isManaged = status === "MANAGED"
  const parsedSongPackId = songPackId === "" ? null : Number(songPackId)

  // MANAGED 일 때만 target/floor 를 보내고, 그 외엔 null (backend 무시)
  const body: VirtualCrewBulkRequest = {
    partyroomIds: selectedIds,
    status,
    targetCount: isManaged ? parseNum(targetCount) : null,
    djBotCount: isManaged ? parseNum(djBotCount) : null,
    songPackId: isManaged ? parsedSongPackId : null,
  }

  const parsed = VirtualCrewBulkSchema.safeParse(body)
  const submitDisabled = !parsed.success || mutation.isPending

  // MANAGED + 송팩 없음 경고 (backend reconcile SKIP_NO_SONG_PACK)
  const showNoSongPackWarning = isManaged && parsedSongPackId === null

  const handleOpenChange = (next: boolean) => {
    if (mutation.isPending && !next) return
    onOpenChange(next)
  }

  const handleSubmit = () => {
    if (!parsed.success) return
    mutation.mutate(parsed.data, {
      onSuccess: () => {
        onSuccess?.()
        onOpenChange(false)
      },
    })
  }

  const previewIds =
    selectedIds.length <= 6
      ? selectedIds.join(", ")
      : `${selectedIds.slice(0, 5).join(", ")} 외 ${selectedIds.length - 5}건`

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>가상 DJ 설정 ({selectedIds.length}건)</DialogTitle>
          <DialogDescription>
            선택된 ID: <span className="text-foreground">{previewIds}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="vdj-status">상태</Label>
            <select
              id="vdj-status"
              aria-label="가상 DJ 상태"
              value={status}
              onChange={(e) => setStatus(e.target.value as VirtualCrewStatus)}
              className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {VIRTUAL_CREW_STATUS.label[s]}
                </option>
              ))}
            </select>
          </div>

          {isManaged && (
            <>
              <div className="space-y-1">
                <Label htmlFor="vdj-target">목표 인원 (1 이상)</Label>
                <Input
                  id="vdj-target"
                  type="number"
                  min={1}
                  aria-label="목표 인원"
                  value={targetCount}
                  onChange={(e) => setTargetCount(e.target.value)}
                  placeholder="예: 8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="vdj-djbot">DJ 봇 수 (0 이상)</Label>
                <Input
                  id="vdj-djbot"
                  type="number"
                  min={0}
                  aria-label="DJ 봇 수"
                  value={djBotCount}
                  onChange={(e) => setDjBotCount(e.target.value)}
                  placeholder="예: 2"
                />
                <p className="text-muted-foreground text-xs">
                  총 봇 중 DJ 역할 수 (나머지는 리스너). 목표 인원 이하여야 합니다.
                </p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="vdj-songpack">송팩 (운영중일 때 필수)</Label>
                <select
                  id="vdj-songpack"
                  aria-label="송팩 선택"
                  value={songPackId}
                  onChange={(e) => setSongPackId(e.target.value)}
                  className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                >
                  <option value="">선택 안 함</option>
                  {(songPacks ?? []).map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name} ({p.trackCount}곡)
                    </option>
                  ))}
                </select>
                {showNoSongPackWarning && (
                  <p className="text-amber-600 text-sm" role="alert">
                    운영중이려면 송팩을 선택해야 해요 (미선택 시 봇이 배치되지 않음)
                  </p>
                )}
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={submitDisabled}>
            {mutation.isPending ? "적용 중..." : "일괄 적용"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
