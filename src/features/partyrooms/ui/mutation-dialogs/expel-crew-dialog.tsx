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
  ExpelCrewSchema,
  type ExpelCrewRequest,
} from "@/features/partyrooms/model/mutation-schema"
import { useExpelCrew } from "@/features/partyrooms/api/use-expel-crew"

interface Props {
  partyroomId: number
  crewId: number
  crewLabel: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExpelCrewDialog({
  partyroomId,
  crewId,
  crewLabel,
  open,
  onOpenChange,
}: Props) {
  const mutation = useExpelCrew()
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<ExpelCrewRequest>({
    resolver: zodResolver(ExpelCrewSchema),
    mode: "onChange",
    defaultValues: { crewId, reason: "" },
  })

  useDialogResetEffect(open, () => {
    mutation.reset()
    reset({ crewId, reason: "" })
  })

  const onSubmit = (data: ExpelCrewRequest) =>
    mutation.mutate(
      { partyroomId, crewId, reason: data.reason },
      { onSuccess: () => onOpenChange(false) },
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>크루 강퇴</DialogTitle>
            <DialogDescription>
              {crewLabel} 를 이 파티룸에서 강퇴합니다 (1회성, 영구 밴 아님).
              사유는 audit log에 기록됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="expel-reason">
              사유 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="expel-reason"
              aria-label="사유"
              {...register("reason")}
              maxLength={255}
              rows={4}
            />
            {errors.reason && (
              <p className="text-sm text-destructive">{errors.reason.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!isValid || mutation.isPending}
            >
              {mutation.isPending ? "처리 중..." : "강퇴"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
