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
import { useSetBotAvatar } from "../api/use-set-bot-avatar"
import { AvatarPicker } from "./avatar-picker"

interface Props {
  userId: number
  nickname: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** 봇 1명의 아바타를 카탈로그에서 single 선택해 설정한다. */
export function SetBotAvatarDialog({
  userId,
  nickname,
  open,
  onOpenChange,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const mutation = useSetBotAvatar()

  useDialogResetEffect(open, () => {
    setSelected(null)
    mutation.reset()
  })

  const submitDisabled = selected === null || mutation.isPending

  const handleOpenChange = (next: boolean) => {
    if (mutation.isPending && !next) return
    onOpenChange(next)
  }

  const handleSubmit = () => {
    if (selected === null) return
    mutation.mutate(
      { userId, avatarBodyUri: selected },
      {
        onSuccess: () => onOpenChange(false),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>아바타 변경 — {nickname}</DialogTitle>
          <DialogDescription>
            카탈로그에서 아바타 하나를 골라 적용합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto py-2">
          <AvatarPicker
            mode="single"
            value={selected}
            onChange={setSelected}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={mutation.isPending}
          >
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={submitDisabled}>
            {mutation.isPending ? "적용 중..." : "적용"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
