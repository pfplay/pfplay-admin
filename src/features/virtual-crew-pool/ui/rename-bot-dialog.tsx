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
import { useRenameBot } from "../api/use-rename-bot"

interface Props {
  userId: string
  nickname: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 봇 닉네임 변경 — 파티룸에 노출되는 이름이라 사람처럼 보이는 이름으로 덮어쓸 수 있다.
 * 현재 닉네임을 프리필. 비블랭크·20자 이하(백엔드 도메인 규칙과 동일), 중복은 백엔드 409.
 */
export function RenameBotDialog({ userId, nickname, open, onOpenChange }: Props) {
  const [value, setValue] = useState(nickname)
  const mutation = useRenameBot()

  useDialogResetEffect(open, () => {
    setValue(nickname)
    mutation.reset()
  })

  const trimmed = value.trim()
  const submitDisabled =
    trimmed.length === 0 ||
    trimmed.length > 20 ||
    trimmed === nickname ||
    mutation.isPending

  const handleOpenChange = (next: boolean) => {
    if (mutation.isPending && !next) return
    onOpenChange(next)
  }

  const handleSubmit = () => {
    if (submitDisabled) return
    mutation.mutate(
      { userId, nickname: trimmed },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>닉네임 변경</DialogTitle>
          <DialogDescription>
            파티룸에 노출되는 이름입니다. 20자 이하, 다른 사용자와 중복될 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="bot-nickname">닉네임</Label>
          <Input
            id="bot-nickname"
            value={value}
            maxLength={20}
            autoFocus
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit()
            }}
          />
          <p className="text-xs text-muted-foreground">{trimmed.length}/20</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            취소
          </Button>
          <Button disabled={submitDisabled} onClick={handleSubmit}>
            {mutation.isPending ? "저장 중…" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
