import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRemoveBots } from "../api/use-remove-bots"
import type { BotRosterItem } from "@/entities/virtual-crew"

interface Props {
  bots: BotRosterItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 제거 성공 시 선택 해제 */
  onRemoved?: () => void
}

/**
 * 봇 일괄 제거(탈퇴) 확인 다이얼로그. 배치된 봇은 제거 불가 — 먼저 해당 방을 리소스 회수/재배치해야 한다.
 * 배치된 봇이 선택에 하나라도 있으면 확인 버튼을 막고 이유를 명시한다(백엔드 409 와 동일 정책).
 */
export function RemoveBotsDialog({ bots, open, onOpenChange, onRemoved }: Props) {
  const mutation = useRemoveBots()
  const placed = bots.filter((b) => b.placementRoomId !== null)
  const hasPlaced = placed.length > 0

  const handleRemove = () => {
    mutation.mutate(
      bots.map((b) => b.userId),
      {
        onSuccess: () => {
          onOpenChange(false)
          onRemoved?.()
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>봇 {bots.length}명 제거</DialogTitle>
          <DialogDescription>
            선택한 봇을 풀에서 제거(탈퇴)합니다. 제거된 봇은 로스터·배치 대상에서 사라지며 되돌릴 수
            없습니다.
          </DialogDescription>
        </DialogHeader>

        {hasPlaced ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            배치된 봇 {placed.length}명이 포함되어 있습니다. 먼저 해당 방을 <b>리소스 회수</b> 또는{" "}
            <b>재배치</b>한 뒤 제거하세요.
          </p>
        ) : (
          <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2 text-sm">
            {bots.map((b) => (
              <li key={b.userId} className="truncate">
                {b.nickname}
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            variant="destructive"
            disabled={hasPlaced || mutation.isPending || bots.length === 0}
            onClick={handleRemove}
          >
            {mutation.isPending ? "제거 중…" : "제거"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
