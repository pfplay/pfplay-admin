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
import { usePublishAvatar } from "@/features/avatars/api/use-publish-avatar"
import type { AvatarResourceType } from "@/entities/avatar"

interface Props {
  resourceType: AvatarResourceType
  id: number
  name: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PublishAvatarDialog({
  resourceType,
  id,
  name,
  open,
  onOpenChange,
}: Props) {
  const mutation = usePublishAvatar(resourceType)

  useDialogResetEffect(open, () => mutation.reset())

  const handleOpenChange = (next: boolean) => {
    if (mutation.isPending && !next) return
    onOpenChange(next)
  }

  const handleSubmit = () => {
    if (mutation.isPending) return
    mutation.mutate(id, {
      onSuccess: () => onOpenChange(false),
    })
  }

  const label = resourceType === "body" ? "Body" : "Face"

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label} 게시 — {name}</DialogTitle>
          <DialogDescription>
            DRAFT → PUBLISHED 전이합니다. 게시 후엔 이미지 교체가 불가합니다 (AVT-007).
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? "처리 중..." : "게시"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
