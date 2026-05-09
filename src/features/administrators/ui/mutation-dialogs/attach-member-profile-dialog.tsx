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
import { useAttachMemberProfile } from "@/features/administrators/api/use-attach-member-profile"
import { attachMemberProfileRequestSchema } from "@/features/administrators/model/mutation-schema"

interface Props {
  administratorId: number
  email: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AttachMemberProfileDialog({
  administratorId,
  email,
  open,
  onOpenChange,
}: Props) {
  const [nickname, setNickname] = useState("")
  const [error, setError] = useState<string | null>(null)
  const mutation = useAttachMemberProfile()

  useEffect(() => {
    if (open) {
      setNickname("")
      setError(null)
      mutation.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleSubmit = () => {
    const parsed = attachMemberProfileRequestSchema.safeParse({
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
          <DialogTitle>멤버 프로필 연결</DialogTitle>
          <DialogDescription>
            <code className="font-mono">{email}</code> (#{administratorId}) 에 멤버
            프로필을 신규 생성하여 연결합니다. 어드민이 pfplay-web 서비스를 사용할
            수 있게 됩니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1 py-2">
          <Label htmlFor="attach-nickname">닉네임</Label>
          <Input
            id="attach-nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={64}
            placeholder="멤버 프로필에 표시될 닉네임"
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
            {mutation.isPending ? "연결 중..." : "연결"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
