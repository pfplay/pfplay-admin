import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
  TerminateReasonSchema,
  type TerminateRequest,
} from "@/features/partyrooms/model/mutation-schema"
import { useTerminatePartyroom } from "@/features/partyrooms/api/use-terminate-partyroom"

interface Props {
  partyroomId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TerminateDialog({ partyroomId, open, onOpenChange }: Props) {
  const mutation = useTerminatePartyroom()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TerminateRequest>({
    resolver: zodResolver(TerminateReasonSchema),
    defaultValues: { reason: "" },
  })

  useEffect(() => {
    if (!open) {
      mutation.reset()
      reset()
    }
  }, [open])

  const onSubmit = (data: TerminateRequest) =>
    mutation.mutate(
      { partyroomId, reason: data.reason },
      { onSuccess: () => onOpenChange(false) },
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>파티룸 강제 종료</DialogTitle>
            <DialogDescription>
              종료된 룸은 기본 필터에서 자동 제외됩니다. 사유는 audit log에 기록됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="terminate-reason">
              사유 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="terminate-reason"
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
            <Button type="submit" variant="destructive" disabled={mutation.isPending}>
              {mutation.isPending ? "처리 중..." : "강제 종료"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
