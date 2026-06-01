import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useVirtualDjLiveStatus } from "@/features/partyrooms/api/use-virtual-dj-live-status"
import { useApplyVirtualDj } from "@/features/partyrooms/api/use-apply-virtual-dj"
import { useDrainVirtualDj } from "@/features/partyrooms/api/use-drain-virtual-dj"
import { useFreezeVirtualDj } from "@/features/partyrooms/api/use-freeze-virtual-dj"
import {
  VirtualDjConfigSchema,
  type VirtualDjConfigRequest,
} from "@/features/partyrooms/model/virtual-dj-config-schema"
import { useSongPacks } from "@/features/virtual-dj-song-packs/api/use-song-packs"
import { VIRTUAL_DJ_STATUS } from "@/shared/lib/labels"
import type { VirtualDjStatus } from "@/entities/virtual-dj"

const STATUS_OPTIONS: VirtualDjStatus[] = ["OFF", "MANAGED", "FROZEN"]

// 빈 문자열/숫자 입력을 number|null 로 정규화
function parseNum(v: string): number | null {
  const t = v.trim()
  if (t === "") return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

interface Props {
  partyroomId: number
}

export function VirtualDjConfigCard({ partyroomId }: Props) {
  const { data: live, isLoading, error } = useVirtualDjLiveStatus(partyroomId)
  const { data: songPacks } = useSongPacks()
  const applyMutation = useApplyVirtualDj(partyroomId)
  const drainMutation = useDrainVirtualDj(partyroomId)
  const freezeMutation = useFreezeVirtualDj(partyroomId)

  const [status, setStatus] = useState<VirtualDjStatus>("OFF")
  const [targetCount, setTargetCount] = useState("")
  const [companionFloor, setCompanionFloor] = useState("")
  const [songPackId, setSongPackId] = useState<string>("") // "" = 없음
  const [drainOpen, setDrainOpen] = useState(false)

  // 서버 live status 가 로드되면 폼 초기값을 동기화 (1회/갱신 시)
  useEffect(() => {
    if (!live) return
    setStatus(live.status)
    setTargetCount(live.targetCount === null ? "" : String(live.targetCount))
    setCompanionFloor(
      live.companionFloor === null ? "" : String(live.companionFloor),
    )
    setSongPackId(live.songPackId === null ? "" : String(live.songPackId))
  }, [live])

  const isManaged = status === "MANAGED"
  const parsedSongPackId = songPackId === "" ? null : Number(songPackId)

  const body: VirtualDjConfigRequest = {
    status,
    targetCount: isManaged ? parseNum(targetCount) : null,
    companionFloor: isManaged ? parseNum(companionFloor) : null,
    songPackId: isManaged ? parsedSongPackId : null,
  }
  const parsed = VirtualDjConfigSchema.safeParse(body)
  const applyDisabled = !parsed.success || applyMutation.isPending

  // MANAGED + 송팩 없음 경고 (backend reconcile SKIP_NO_SONG_PACK)
  const showNoSongPackWarning = isManaged && parsedSongPackId === null

  const handleApply = () => {
    if (!parsed.success) return
    applyMutation.mutate(parsed.data)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>가상 DJ</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error || !live) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>가상 DJ</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            가상 DJ 상태를 불러오지 못했습니다.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          가상 DJ
          <Badge variant={VIRTUAL_DJ_STATUS.variant[live.status] ?? "outline"}>
            {VIRTUAL_DJ_STATUS.label[live.status] ?? live.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* live status */}
        <div className="text-sm">
          <span className="text-muted-foreground">현재 봇</span>{" "}
          <span className="font-medium">
            봇 {live.currentBotDjCount}/{live.targetCount ?? "—"}
          </span>
        </div>

        {/* config form */}
        <div className="space-y-1">
          <Label htmlFor="vdj-room-status">상태</Label>
          <select
            id="vdj-room-status"
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
              <Label htmlFor="vdj-room-target">목표 인원 (1 이상)</Label>
              <Input
                id="vdj-room-target"
                type="number"
                min={1}
                aria-label="목표 인원"
                value={targetCount}
                onChange={(e) => setTargetCount(e.target.value)}
                placeholder="예: 8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vdj-room-floor">최소 동행 인원 (0 이상)</Label>
              <Input
                id="vdj-room-floor"
                type="number"
                min={0}
                aria-label="최소 동행 인원"
                value={companionFloor}
                onChange={(e) => setCompanionFloor(e.target.value)}
                placeholder="예: 2"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vdj-room-songpack">송팩 (선택)</Label>
              <select
                id="vdj-room-songpack"
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

        <div className="flex flex-wrap gap-2 pt-1">
          <Button onClick={handleApply} disabled={applyDisabled}>
            {applyMutation.isPending ? "적용 중..." : "적용"}
          </Button>
          <Button
            variant="outline"
            onClick={() => freezeMutation.mutate()}
            disabled={freezeMutation.isPending}
          >
            {freezeMutation.isPending ? "동결 중..." : "동결"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDrainOpen(true)}
            disabled={drainMutation.isPending}
          >
            봇 비우기
          </Button>
        </div>
      </CardContent>

      {/* drain = 파괴적 → confirm */}
      <Dialog open={drainOpen} onOpenChange={setDrainOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>봇 전부 제거</DialogTitle>
            <DialogDescription>
              이 파티룸의 가상 DJ 봇을 전부 제거합니다. 운영 상태(상태 설정)는
              유지됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDrainOpen(false)}
              disabled={drainMutation.isPending}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={drainMutation.isPending}
              onClick={() =>
                drainMutation.mutate(undefined, {
                  onSuccess: () => setDrainOpen(false),
                })
              }
            >
              {drainMutation.isPending ? "제거 중..." : "봇 비우기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
