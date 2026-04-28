import { useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRestorePartyroom } from "@/features/partyrooms/api/use-restore-partyroom"

interface Props {
  partyroomId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RestoreDialog({ partyroomId, open, onOpenChange }: Props) {
  const mutation = useRestorePartyroom()

  useEffect(() => {
    if (!open) mutation.reset()
  }, [open])

  const handleSubmit = () =>
    mutation.mutate({ partyroomId }, { onSuccess: () => onOpenChange(false) })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>파티룸 재개</DialogTitle>
          <DialogDescription>
            일시 정지된 파티룸을 정상 운영으로 복귀합니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? "처리 중..." : "재개"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
