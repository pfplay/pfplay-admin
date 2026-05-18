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
import { useCompleteAnnouncement } from "../api/use-complete-announcement"
import type { Announcement } from "@/entities/announcement"

interface Props {
  target: Announcement | null
  onOpenChange: (open: boolean) => void
}

export function CompleteAnnouncementDialog({ target, onOpenChange }: Props) {
  const mutation = useCompleteAnnouncement()
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
          <DialogTitle>점검 정상 종료</DialogTitle>
          <DialogDescription>
            {target ? (
              <>
                <code className="font-mono">#{target.id}</code>{" "}
                {ANNOUNCEMENT_TYPE.label[target.type]} —{" "}
                <span className="font-medium">{target.titleKo}</span> 점검을
                정상 종료합니다.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <p className="text-xs text-muted-foreground py-2">
          지금 점검을 정상 종료합니다. 사용자가 즉시 서비스로 복귀합니다. 되돌릴 수 없습니다.
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
            {mutation.isPending ? "처리 중..." : "확정"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
