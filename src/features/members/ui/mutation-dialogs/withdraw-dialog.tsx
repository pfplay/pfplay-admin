import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useWithdrawMember } from "@/features/members/api/use-withdraw-member"
import { useDialogResetEffect } from "@/shared/lib/use-dialog-reset-effect"

interface Props {
  memberId: number
  displayName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WithdrawDialog({ memberId, displayName, open, onOpenChange }: Props) {
  const mutation = useWithdrawMember()

  useDialogResetEffect(open, () => mutation.reset())

  const handleSubmit = () => {
    mutation.mutate(
      { memberId },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>비식별화 탈퇴 처리</DialogTitle>
          <DialogDescription>
            <strong>{displayName}</strong> 회원을 탈퇴 처리합니다. 이메일 PII가 erase되며 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "처리 중..." : "탈퇴 처리"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
