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
import { Checkbox } from "@/components/ui/checkbox"
import { useCreateAdministrator } from "@/features/administrators/api/use-create-administrator"
import {
  createAdministratorRequestSchema,
  type CreateAdministratorRequest,
} from "@/features/administrators/model/mutation-schema"
import type { CreateAdministratorResponse } from "@/entities/administrator"
import { toast } from "sonner"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// 2단계 dialog: form 입력 → 응답의 tempPassword 노출 (한 번만, 닫으면 재조회 불가).
// 사용자가 임시 비번을 복사 후 신규 어드민에게 안전하게 전달해야 함.
export function CreateAdministratorDialog({ open, onOpenChange }: Props) {
  const [email, setEmail] = useState("")
  const [nickname, setNickname] = useState("")
  const [includeMemberProfile, setIncludeMemberProfile] = useState(true)
  const [result, setResult] = useState<CreateAdministratorResponse | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const mutation = useCreateAdministrator()

  useDialogResetEffect(open, () => {
    setEmail("")
    setNickname("")
    setIncludeMemberProfile(true)
    setResult(null)
    setErrors({})
    mutation.reset()
  })

  const handleOpenChange = (next: boolean) => {
    if (mutation.isPending && !next) return
    onOpenChange(next)
  }

  const handleSubmit = () => {
    const body: CreateAdministratorRequest = {
      email: email.trim(),
      nickname: nickname.trim(),
      includeMemberProfile,
    }
    const parsed = createAdministratorRequestSchema.safeParse(body)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        if (issue.path[0]) fieldErrors[String(issue.path[0])] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    mutation.mutate(parsed.data, {
      onSuccess: (response) => {
        setResult(response)
      },
    })
  }

  const handleCopyTempPassword = () => {
    if (!result) return
    navigator.clipboard
      .writeText(result.tempPassword)
      .then(() => toast.success("임시 비밀번호를 복사했습니다"))
      .catch(() => toast.error("복사 실패 — 직접 선택해서 복사해주세요"))
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {result === null ? (
          <>
            <DialogHeader>
              <DialogTitle>신규 어드민 생성</DialogTitle>
              <DialogDescription>
                ADMIN 권한으로 생성됩니다. 임시 비밀번호는 응답 직후 1회만 노출됩니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="admin-email">이메일</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  placeholder="admin@example.com"
                />
                {errors["email"] && (
                  <p className="text-xs text-destructive">{errors["email"]}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="admin-nickname">닉네임</Label>
                <Input
                  id="admin-nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={64}
                  placeholder="운영자 닉네임"
                />
                {errors["nickname"] && (
                  <p className="text-xs text-destructive">{errors["nickname"]}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="admin-include-member"
                  checked={includeMemberProfile}
                  onCheckedChange={(c) => setIncludeMemberProfile(c === true)}
                  aria-label="멤버 프로필 함께 생성"
                />
                <Label
                  htmlFor="admin-include-member"
                  className="text-sm font-normal cursor-pointer"
                >
                  멤버 프로필 함께 생성 (권장)
                </Label>
              </div>
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
                {mutation.isPending ? "생성 중..." : "생성"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>어드민 생성 완료</DialogTitle>
              <DialogDescription>
                임시 비밀번호는 이 화면을 닫으면 재조회할 수 없습니다. 안전한 채널로
                전달하고 즉시 변경하도록 안내하세요.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2 text-sm">
              <div>
                <span className="text-muted-foreground">어드민 ID</span>
                <div>#{result.administratorId}</div>
              </div>
              {result.memberId && (
                <div>
                  <span className="text-muted-foreground">멤버 ID</span>
                  <div>#{result.memberId}</div>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">임시 비밀번호</span>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 px-3 py-2 rounded border bg-muted font-mono">
                    {result.tempPassword}
                  </code>
                  <Button variant="outline" size="sm" onClick={handleCopyTempPassword}>
                    복사
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{result.message}</p>
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
