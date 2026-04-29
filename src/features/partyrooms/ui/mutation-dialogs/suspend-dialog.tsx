import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import {
  SuspendReasonSchema,
  type SuspendRequest,
} from "@/features/partyrooms/model/mutation-schema"
import { useSuspendPartyroom } from "@/features/partyrooms/api/use-suspend-partyroom"

interface Props {
  partyroomId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SuspendDialog({ partyroomId, open, onOpenChange }: Props) {
  const mutation = useSuspendPartyroom()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SuspendRequest>({
    resolver: zodResolver(SuspendReasonSchema),
    defaultValues: { reason: "" },
  })

  useDialogResetEffect(open, () => {
    mutation.reset()
    reset()
  })

  const onSubmit = (data: SuspendRequest) =>
    mutation.mutate(
      { partyroomId, reason: data.reason },
      { onSuccess: () => onOpenChange(false) },
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>파티룸 일시 정지</DialogTitle>
            <DialogDescription>
              운영자 검토 중 일시 정지합니다. 사유는 audit log에 기록됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="suspend-reason">
              사유 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="suspend-reason"
              aria-label="사유"
              {...register("reason")}
              maxLength={500}
              rows={4}
            />
            {errors.reason && (
              <p className="text-sm text-destructive">{errors.reason.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "처리 중..." : "일시 정지"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
