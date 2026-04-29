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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useRetireAvatar } from "@/features/avatars/api/use-retire-avatar"
import type { AvatarResourceType } from "@/entities/avatar"

interface Props {
  resourceType: AvatarResourceType
  id: number
  name: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RetireAvatarDialog({
  resourceType,
  id,
  name,
  open,
  onOpenChange,
}: Props) {
  const [reason, setReason] = useState("")
  const mutation = useRetireAvatar(resourceType)
  const reasonValid = reason.trim().length >= 1

  useDialogResetEffect(open, () => {
    setReason("")
    mutation.reset()
  })

  const handleOpenChange = (next: boolean) => {
    if (mutation.isPending && !next) return
    onOpenChange(next)
  }

  const handleSubmit = () => {
    if (!reasonValid || mutation.isPending) return
    mutation.mutate(
      { id, body: { reason: reason.trim() } },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  const label = resourceType === "body" ? "Body" : "Face"

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label} 회수 — {name}</DialogTitle>
          <DialogDescription>
            PUBLISHED → RETIRED 전이합니다. 회수 사유 필수.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-1">
          <Label htmlFor="retire-reason">
            회수 사유 <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="retire-reason"
            aria-label="회수 사유"
            aria-required="true"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="사유 (필수, 최대 1000자)"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reasonValid || mutation.isPending}
          >
            {mutation.isPending ? "처리 중..." : "회수"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
