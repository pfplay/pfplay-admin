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
import { useDeleteSongPack } from "../api/use-delete-song-pack"

interface Props {
  packId: number
  packName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteSongPackDialog({
  packId,
  packName,
  open,
  onOpenChange,
}: Props) {
  const mutation = useDeleteSongPack()

  useDialogResetEffect(open, () => mutation.reset())

  const handleSubmit = () =>
    mutation.mutate(packId, { onSuccess: () => onOpenChange(false) })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>송팩 삭제</DialogTitle>
          <DialogDescription>
            <strong>{packName}</strong> 송팩을 삭제합니다. 룸에서 사용 중인
            송팩은 삭제할 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "처리 중..." : "삭제"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
