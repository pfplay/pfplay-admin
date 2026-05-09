import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRevokeAdministrator } from "@/features/administrators/api/use-revoke-administrator"

interface Props {
  administratorId: number
  email: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RevokeAdministratorDialog({
  administratorId,
  email,
  open,
  onOpenChange,
}: Props) {
  const mutation = useRevokeAdministrator()

  const handleConfirm = () => {
    mutation.mutate(administratorId, {
      onSuccess: () => onOpenChange(false),
    })
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
          <DialogTitle>권한 회수</DialogTitle>
          <DialogDescription>
            <code className="font-mono">{email}</code> (#{administratorId}) 어드민
            권한을 회수합니다. 회수 후 어드민 콘솔에 로그인할 수 없으며 본 작업은
            되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <p className="text-xs text-muted-foreground py-2">
          backend 정책: 마지막 슈퍼어드민 / 본인 권한은 회수 불가 (toast로 안내).
        </p>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "처리 중..." : "회수"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
