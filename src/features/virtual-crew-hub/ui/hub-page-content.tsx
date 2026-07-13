import { Link } from "react-router-dom"
import { Bot, ListMusic, Drama, SlidersHorizontal, ChevronRight, TriangleAlert } from "lucide-react"
import { usePoolSummary } from "@/features/virtual-crew-pool/api/use-pool-summary"
import { useSongPacks } from "@/features/virtual-crew-song-packs/api/use-song-packs"
import { useChatConfig } from "@/features/virtual-crew-chat-config/api/use-chat-config"
import { cn } from "@/shared/lib/utils"

type Readiness = "ok" | "warn" | "optional"

interface StepCardProps {
  step: number
  icon: typeof Bot
  title: string
  hint: string
  status: string
  readiness: Readiness
  to: string
  action: string
}

const DOT: Record<Readiness, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  optional: "bg-muted-foreground/40",
}

function StepCard({ step, icon: Icon, title, hint, status, readiness, to, action }: StepCardProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 rounded-lg border border-border bg-card px-5 py-4 transition-colors hover:bg-accent"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
        {step}
      </span>
      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{title}</span>
          <span className={cn("h-2 w-2 rounded-full", DOT[readiness])} aria-hidden />
        </div>
        <p className="truncate text-sm text-muted-foreground">{hint}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-medium text-foreground">{status}</p>
        <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
          {action} <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  )
}

export function VirtualCrewHubPageContent() {
  const pool = usePoolSummary()
  const songPacks = useSongPacks()
  const chat = useChatConfig()

  const total = pool.data?.total ?? 0
  const idle = pool.data?.idle ?? 0
  const placedRooms = pool.data?.placed.length ?? 0
  const placedBots = pool.data?.placed.reduce((sum, p) => sum + p.botCount, 0) ?? 0
  const packCount = songPacks.data?.length ?? 0
  const chatOn = chat.data?.chatEnabled ?? false

  const noBots = !pool.isLoading && total === 0
  const noIdle = !pool.isLoading && total > 0 && idle === 0
  const noPacks = !songPacks.isLoading && packCount === 0

  const warnings: string[] = []
  if (noBots) warnings.push("봇 계정이 없습니다 — 봇 풀에서 먼저 충원하세요.")
  if (noPacks) warnings.push("송팩이 없습니다 — 배치하려면 송팩이 반드시 필요합니다.")
  if (noIdle) warnings.push("유휴 봇이 없습니다 — 배치가 부족할 수 있으니 봇 풀에서 충원하세요.")

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">가상 크루 관리</h1>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            chatOn ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground",
          )}
        >
          {chatOn ? "채팅 사용중" : "채팅 꺼짐"}
        </span>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        아래 순서대로 준비한 뒤 방에 배치하세요. 봇 풀 → 송팩 → (선택) 채팅 → 크루 배치.
      </p>

      {warnings.length > 0 && (
        <div className="mb-5 space-y-1 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
          {warnings.map((w) => (
            <p key={w} className="flex items-center gap-2 text-sm text-amber-700">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              {w}
            </p>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <StepCard
          step={1}
          icon={Bot}
          title="봇 풀"
          hint="배치에 쓸 봇 계정을 생산·재고 관리 (공급)"
          status={pool.isLoading ? "…" : `유휴 ${idle} / 전체 ${total}`}
          readiness={noBots ? "warn" : "ok"}
          to="/virtual-crew/pool"
          action="충원"
        />
        <StepCard
          step={2}
          icon={ListMusic}
          title="송팩"
          hint="봇이 틀 곡 묶음 — 배치 필수 자산"
          status={songPacks.isLoading ? "…" : `${packCount}개`}
          readiness={noPacks ? "warn" : "ok"}
          to="/virtual-crew/song-packs"
          action="관리"
        />
        <StepCard
          step={3}
          icon={Drama}
          title="페르소나 · 채팅 (선택)"
          hint="채팅을 켤 때만 필요 — 봇 성격/응답 설정"
          status={chat.isLoading ? "…" : chatOn ? "채팅 ON" : "채팅 OFF"}
          readiness="optional"
          to="/virtual-crew/chat-config"
          action="설정"
        />
        <StepCard
          step={4}
          icon={SlidersHorizontal}
          title="크루 배치 & 운영"
          hint="방별 총원/DJ/송팩 설정 · 적용/드레인/재배치"
          status={pool.isLoading ? "…" : `방 ${placedRooms} · 배치봇 ${placedBots}`}
          readiness="ok"
          to="/virtual-crew/rooms"
          action="배치 관리"
        />
      </div>
    </div>
  )
}
