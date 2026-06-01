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
import { useBulkVirtualDj } from "@/features/partyrooms/api/use-bulk-virtual-dj"
import {
  VirtualDjBulkSchema,
  type VirtualDjBulkRequest,
} from "@/features/partyrooms/model/virtual-dj-bulk-schema"
import { useSongPacks } from "@/features/virtual-dj-song-packs/api/use-song-packs"
import { VIRTUAL_DJ_STATUS } from "@/shared/lib/labels"
import type { VirtualDjStatus } from "@/entities/virtual-dj"

const STATUS_OPTIONS: VirtualDjStatus[] = ["OFF", "MANAGED", "FROZEN"]

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

export function VirtualDjBulkDialog({
  selectedIds,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [status, setStatus] = useState<VirtualDjStatus>("OFF")
  const [targetCount, setTargetCount] = useState("")
  const [companionFloor, setCompanionFloor] = useState("")
  const [songPackId, setSongPackId] = useState<string>("") // "" = 없음
  const mutation = useBulkVirtualDj()
  const { data: songPacks } = useSongPacks()

  useDialogResetEffect(open, () => {
    setStatus("OFF")
    setTargetCount("")
    setCompanionFloor("")
    setSongPackId("")
    mutation.reset()
  })

  const isManaged = status === "MANAGED"
  const parsedSongPackId = songPackId === "" ? null : Number(songPackId)

  // MANAGED 일 때만 target/floor 를 보내고, 그 외엔 null (backend 무시)
  const body: VirtualDjBulkRequest = {
    partyroomIds: selectedIds,
    status,
    targetCount: isManaged ? parseNum(targetCount) : null,
    companionFloor: isManaged ? parseNum(companionFloor) : null,
    songPackId: isManaged ? parsedSongPackId : null,
  }

  const parsed = VirtualDjBulkSchema.safeParse(body)
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
              onChange={(e) => setStatus(e.target.value as VirtualDjStatus)}
              className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {VIRTUAL_DJ_STATUS.label[s]}
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
                <Label htmlFor="vdj-floor">최소 동행 인원 (0 이상)</Label>
                <Input
                  id="vdj-floor"
                  type="number"
                  min={0}
                  aria-label="최소 동행 인원"
                  value={companionFloor}
                  onChange={(e) => setCompanionFloor(e.target.value)}
                  placeholder="예: 2"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="vdj-songpack">송팩 (선택)</Label>
                <select
                  id="vdj-songpack"
                  aria-label="송팩 선택"
                  value={songPackId}
                  onChange={(e) => setSongPackId(e.target.value)}
                  className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                >
                  <option value="">없음</option>
                  {(songPacks ?? []).map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name} ({p.trackCount}곡)
                    </option>
                  ))}
                </select>
                {showNoSongPackWarning && (
                  <p className="text-amber-600 text-sm" role="alert">
                    송팩 없으면 봇이 곡을 못 틉니다
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
