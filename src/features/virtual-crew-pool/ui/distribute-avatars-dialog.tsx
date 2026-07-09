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
import { useDistributeAvatars } from "../api/use-distribute-avatars"
import { distributeAvatarsSchema } from "../model/distribute-schema"
import { AvatarPicker } from "./avatar-picker"

interface Props {
  /** 일괄 배분 대상 봇 userId 목록 */
  botIds: number[]
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 배분 성공(invalidate 후) 시 호출 — 부모가 선택 해제 등 처리 */
  onDistributed?: () => void
}

/**
 * 선택된 봇들에 아바타 셋(다중)에서 봇별 랜덤 1개씩 배분한다.
 * P2 일괄 다이얼로그 UX 계승: close 시 reset, pending 중 close 차단, 성공 시 결과 요약.
 */
export function DistributeAvatarsDialog({
  botIds,
  open,
  onOpenChange,
  onDistributed,
}: Props) {
  const [bodyUris, setBodyUris] = useState<string[]>([])
  const mutation = useDistributeAvatars()

  useDialogResetEffect(open, () => {
    setBodyUris([])
    mutation.reset()
  })

  const parsed = distributeAvatarsSchema.safeParse({ botIds, bodyUris })
  const submitDisabled = !parsed.success || mutation.isPending

  const handleOpenChange = (next: boolean) => {
    if (mutation.isPending && !next) return
    onOpenChange(next)
  }

  const handleSubmit = () => {
    if (!parsed.success) return
    // 호출별 onSuccess 는 hook onSuccess(invalidate) 이후 실행됨 → 배분 후 부모가 선택 해제
    mutation.mutate(parsed.data, {
      onSuccess: () => onDistributed?.(),
    })
  }

  const result = mutation.data

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>아바타 일괄 변경 ({botIds.length}명)</DialogTitle>
          <DialogDescription>
            선택한 아바타 셋에서 봇별로 랜덤 1개씩 배분합니다.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-2 py-2" role="status">
            <p className="text-sm font-medium text-foreground">
              {result.assigned.length}명에게 아바타를 배분했습니다.
            </p>
            <ul className="max-h-[40vh] divide-y overflow-y-auto text-sm">
              {result.assigned.map((a) => (
                <li
                  key={a.userId}
                  className="flex items-center justify-between py-1.5"
                >
                  <span className="tabular-nums text-muted-foreground">
                    #{a.userId}
                  </span>
                  <span className="line-clamp-1 max-w-[60%] text-xs">
                    {a.avatarBodyUri}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto py-2">
            <AvatarPicker
              mode="multi"
              value={bodyUris}
              onChange={setBodyUris}
            />
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button type="button" onClick={() => handleOpenChange(false)}>
              닫기
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={mutation.isPending}
              >
                취소
              </Button>
              <Button onClick={handleSubmit} disabled={submitDisabled}>
                {mutation.isPending ? "배분 중..." : "배분"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
