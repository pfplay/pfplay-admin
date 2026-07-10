import { useState } from "react"
import { Link } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { hideBrokenImage } from "@/shared/lib/hide-broken-image"
import { useBots } from "../api/use-bots"
import type { BotRosterItem } from "@/entities/virtual-crew"
import { DistributeAvatarsDialog } from "./distribute-avatars-dialog"
import { SetBotAvatarDialog } from "./set-bot-avatar-dialog"
import { AssignPersonaDialog } from "./assign-persona-dialog"

/**
 * 봇 전역 로스터 — 행마다 바디 썸네일 + 닉네임 + 배치룸(있으면 링크) + 선택 체크박스 +
 * 개별 "아바타 변경". 1명 이상 선택 시 상단 툴바로 "아바타 일괄 변경"(셋 랜덤 배분).
 * 아바타는 per-bot 계정 속성이므로 로스터는 룸과 무관한 전역 풀이다.
 */
export function BotRoster() {
  const { data, isLoading, isError } = useBots()
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [distributeOpen, setDistributeOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<BotRosterItem | null>(null)
  const [personaTargetIds, setPersonaTargetIds] = useState<number[] | null>(
    null,
  )

  const toggle = (userId: number) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">봇 로스터</h2>

      {isError ? (
        <p className="text-sm text-destructive">
          봇 로스터를 불러오지 못했습니다.
        </p>
      ) : isLoading || !data ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground">봇이 없습니다.</p>
      ) : (
        <>
          {selectedIds.length > 0 && (
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <span role="status" className="text-sm">
                선택: {selectedIds.length}명
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIds([])}
                >
                  선택 해제
                </Button>
                <Button size="sm" onClick={() => setDistributeOpen(true)}>
                  아바타 일괄 변경
                </Button>
                <Button
                  size="sm"
                  onClick={() => setPersonaTargetIds(selectedIds)}
                >
                  페르소나 일괄 지정
                </Button>
              </div>
            </div>
          )}

          <ul className="divide-y rounded-md border">
            {data.map((bot) => (
              <li
                key={bot.userId}
                className="flex items-center gap-3 px-3 py-2"
              >
                <Checkbox
                  aria-label={`${bot.nickname} 선택`}
                  checked={selectedIds.includes(bot.userId)}
                  onCheckedChange={() => toggle(bot.userId)}
                />
                {/* 채팅 아이콘(P1 보장 대상) + 인룸 바디 실루엣을 함께 노출 */}
                <div className="flex shrink-0 items-end gap-2">
                  <figure className="flex flex-col items-center gap-0.5">
                    <img
                      src={bot.avatarIconUri}
                      alt={`${bot.nickname} 아이콘`}
                      className="h-10 w-10 rounded-full border object-cover"
                      onError={hideBrokenImage}
                    />
                    <figcaption className="text-[10px] leading-none text-muted-foreground">
                      아이콘
                    </figcaption>
                  </figure>
                  <figure className="flex flex-col items-center gap-0.5">
                    <img
                      src={bot.avatarBodyUri}
                      alt={`${bot.nickname} 바디`}
                      className="h-8 w-8 rounded-md object-cover"
                      onError={hideBrokenImage}
                    />
                    <figcaption className="text-[10px] leading-none text-muted-foreground">
                      바디
                    </figcaption>
                  </figure>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {bot.nickname}
                  </p>
                  {bot.placementRoomId !== null ? (
                    <Link
                      to={`/partyrooms/${bot.placementRoomId}`}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      {bot.placementRoomTitle}
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      미배치
                    </span>
                  )}
                </div>
                <div className="hidden w-32 shrink-0 sm:block">
                  <p className="text-[10px] leading-none text-muted-foreground">
                    페르소나
                  </p>
                  <p className="truncate text-sm">
                    {bot.personaName ?? "—"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPersonaTargetIds([bot.userId])}
                >
                  페르소나
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditTarget(bot)}
                >
                  아바타 변경
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}

      <DistributeAvatarsDialog
        botIds={selectedIds}
        open={distributeOpen}
        onOpenChange={setDistributeOpen}
        onDistributed={() => setSelectedIds([])}
      />

      {editTarget && (
        <SetBotAvatarDialog
          userId={editTarget.userId}
          nickname={editTarget.nickname}
          open={editTarget !== null}
          onOpenChange={(next) => {
            if (!next) setEditTarget(null)
          }}
        />
      )}

      {personaTargetIds !== null && (
        <AssignPersonaDialog
          botIds={personaTargetIds}
          open={personaTargetIds !== null}
          onOpenChange={(next) => {
            if (!next) setPersonaTargetIds(null)
          }}
          onApplied={() => {
            // 일괄(선택 전체) 적용 시에만 선택 해제 — 단건 행 버튼은 영향 없음
            if (
              personaTargetIds.length === selectedIds.length &&
              selectedIds.length > 0
            ) {
              setSelectedIds([])
            }
          }}
        />
      )}
    </div>
  )
}
