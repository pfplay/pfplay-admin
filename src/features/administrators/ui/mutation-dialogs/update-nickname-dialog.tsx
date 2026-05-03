import { useState, useEffect } from "react"
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
import { useUpdateAdministrator } from "@/features/administrators/api/use-update-administrator"
import { updateAdministratorRequestSchema } from "@/features/administrators/model/mutation-schema"

interface Props {
  administratorId: number
  currentNickname: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpdateNicknameDialog({
  administratorId,
  currentNickname,
  open,
  onOpenChange,
}: Props) {
  const [nickname, setNickname] = useState(currentNickname ?? "")
  const [error, setError] = useState<string | null>(null)
  const mutation = useUpdateAdministrator()

  useEffect(() => {
    if (open) {
      setNickname(currentNickname ?? "")
      setError(null)
      mutation.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentNickname])

  const handleSubmit = () => {
    const parsed = updateAdministratorRequestSchema.safeParse({
      nickname: nickname.trim(),
    })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "입력값 검증 실패")
      return
    }
    setError(null)
    mutation.mutate(
      { id: administratorId, body: parsed.data },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (mutation.isPending && !o) return
        onOpenChange(o)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>닉네임 변경</DialogTitle>
          <DialogDescription>
            연결된 멤버 프로필의 닉네임을 변경합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1 py-2">
          <Label htmlFor="nickname-input">닉네임</Label>
          <Input
            id="nickname-input"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={64}
            aria-label="닉네임"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
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
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
