import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ANNOUNCEMENT_TYPE } from "@/shared/lib/labels"
import { useCancelAnnouncement } from "../api/use-cancel-announcement"
import type { Announcement } from "@/entities/announcement"

interface Props {
  target: Announcement | null
  onOpenChange: (open: boolean) => void
}

export function CancelAnnouncementDialog({ target, onOpenChange }: Props) {
  const mutation = useCancelAnnouncement()
  const open = target !== null

  const handleConfirm = () => {
    if (!target) return
    mutation.mutate(target.id, {
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
          <DialogTitle>공지 취소</DialogTitle>
          <DialogDescription>
            {target ? (
              <>
                <code className="font-mono">#{target.id}</code>{" "}
                {ANNOUNCEMENT_TYPE.label[target.type]} —{" "}
                <span className="font-medium">{target.titleKo}</span> 공지를 취소합니다.
                사용자 화면에서 즉시 dismiss 되며, 본 작업은 되돌릴 수 없습니다.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <p className="text-xs text-muted-foreground py-2">
          잘못 송출한 경우 취소 후 새로 송출하세요. modify 는 지원되지 않습니다.
        </p>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            돌아가기
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "처리 중..." : "취소 확정"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
