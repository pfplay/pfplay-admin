import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useDialogResetEffect } from "@/shared/lib/use-dialog-reset-effect"
import { useResetAdministratorPassword } from "@/features/administrators/api/use-reset-administrator-password"
import type { ResetPasswordResponse } from "@/entities/administrator"
import { toast } from "sonner"

interface Props {
  administratorId: number
  email: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

// 2단계 dialog: 확인 → tempPassword 노출 (한 번만, 닫으면 재조회 불가).
export function ResetPasswordDialog({
  administratorId,
  email,
  open,
  onOpenChange,
}: Props) {
  const [result, setResult] = useState<ResetPasswordResponse | null>(null)
  const mutation = useResetAdministratorPassword()

  useDialogResetEffect(open, () => {
    setResult(null)
    mutation.reset()
  })

  const handleConfirm = () => {
    mutation.mutate(administratorId, {
      onSuccess: (response) => setResult(response),
    })
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard
      .writeText(result.tempPassword)
      .then(() => toast.success("임시 비밀번호를 복사했습니다"))
      .catch(() => toast.error("복사 실패 — 직접 선택해서 복사해주세요"))
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
        {result === null ? (
          <>
            <DialogHeader>
              <DialogTitle>비밀번호 리셋</DialogTitle>
              <DialogDescription>
                <code className="font-mono">{email}</code> (#{administratorId})
                어드민의 비밀번호를 리셋합니다. 임시 비밀번호가 발급되며 응답 후
                1회만 노출됩니다.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                취소
              </Button>
              <Button onClick={handleConfirm} disabled={mutation.isPending}>
                {mutation.isPending ? "처리 중..." : "리셋"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>비밀번호 리셋 완료</DialogTitle>
              <DialogDescription>
                임시 비밀번호는 이 화면을 닫으면 재조회할 수 없습니다. 안전한 채널로
                전달하고 즉시 변경하도록 안내하세요.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <span className="text-muted-foreground text-sm">임시 비밀번호</span>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 px-3 py-2 rounded border bg-muted font-mono">
                  {result.tempPassword}
                </code>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  복사
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{result.message}</p>
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>닫기</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
