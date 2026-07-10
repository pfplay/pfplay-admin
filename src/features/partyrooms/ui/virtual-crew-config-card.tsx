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
import { useVirtualCrewLiveStatus } from "@/features/partyrooms/api/use-virtual-crew-live-status"
import { useApplyVirtualCrew } from "@/features/partyrooms/api/use-apply-virtual-crew"
import { useDrainVirtualCrew } from "@/features/partyrooms/api/use-drain-virtual-crew"
import { useDrainResourcesVirtualCrew } from "@/features/partyrooms/api/use-drain-resources-virtual-crew"
import { useReviveVirtualCrew } from "@/features/partyrooms/api/use-revive-virtual-crew"
import {
  VirtualCrewConfigSchema,
  type VirtualCrewConfigRequest,
} from "@/features/partyrooms/model/virtual-crew-config-schema"
import { useSongPacks } from "@/features/virtual-crew-song-packs/api/use-song-packs"
import { VIRTUAL_CREW_STATUS } from "@/shared/lib/labels"
import type { VirtualCrewStatus } from "@/entities/virtual-crew"

const STATUS_OPTIONS: VirtualCrewStatus[] = ["OFF", "MANAGED"]

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

export function VirtualCrewConfigCard({ partyroomId }: Props) {
  const { data: live, isLoading, error } = useVirtualCrewLiveStatus(partyroomId)
  const { data: songPacks } = useSongPacks()
  const applyMutation = useApplyVirtualCrew(partyroomId)
  const drainMutation = useDrainVirtualCrew(partyroomId)
  const drainResourcesMutation = useDrainResourcesVirtualCrew(partyroomId)
  const reviveMutation = useReviveVirtualCrew(partyroomId)

  const [status, setStatus] = useState<VirtualCrewStatus>("OFF")
  const [targetCount, setTargetCount] = useState("")
  const [djBotCount, setDjBotCount] = useState("")
  const [songPackId, setSongPackId] = useState<string>("") // "" = 없음
  const [drainOpen, setDrainOpen] = useState(false)

  // 서버 live status 가 로드되면 폼 초기값을 동기화 (1회/갱신 시)
  useEffect(() => {
    if (!live) return
    setStatus(live.status)
    setTargetCount(live.targetCount === null ? "" : String(live.targetCount))
    setDjBotCount(
      live.djBotCount === null ? "" : String(live.djBotCount),
    )
    setSongPackId(live.songPackId === null ? "" : String(live.songPackId))
  }, [live])

  const isManaged = status === "MANAGED"
  const parsedSongPackId = songPackId === "" ? null : Number(songPackId)

  const body: VirtualCrewConfigRequest = {
    status,
    targetCount: isManaged ? parseNum(targetCount) : null,
    djBotCount: isManaged ? parseNum(djBotCount) : null,
    songPackId: isManaged ? parsedSongPackId : null,
  }
  const parsed = VirtualCrewConfigSchema.safeParse(body)
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

  // 부활/리소스 회수는 운영(MANAGED) 상태에서만 의미 있음 (봇이 배치돼 있어야 회수/부활 대상 존재)
  const isLive = live.status === "MANAGED"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          가상 DJ
          <Badge variant={VIRTUAL_CREW_STATUS.variant[live.status] ?? "outline"}>
            {VIRTUAL_CREW_STATUS.label[live.status] ?? live.status}
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
              <Label htmlFor="vdj-room-djbot">DJ 봇 수 (0 이상)</Label>
              <Input
                id="vdj-room-djbot"
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
            onClick={() => reviveMutation.mutate()}
            disabled={!isLive || reviveMutation.isPending}
            title="회수했던 봇을 목표 인원까지 재배치"
          >
            {reviveMutation.isPending ? "부활 중..." : "부활"}
          </Button>
          <Button
            variant="outline"
            onClick={() => drainResourcesMutation.mutate()}
            disabled={!isLive || drainResourcesMutation.isPending}
            title="봇 제거하되 운영(운영중) 상태는 유지"
          >
            {drainResourcesMutation.isPending ? "회수 중..." : "리소스 회수"}
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
              이 파티룸의 가상 DJ 봇을 전부 제거하고 미운영(OFF) 상태로
              전환합니다. 운영을 유지한 채 봇만 회수하려면 "리소스 회수"를
              사용하세요.
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
