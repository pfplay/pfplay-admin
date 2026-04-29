import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useDialogResetEffect } from "@/shared/lib/use-dialog-reset-effect"
import { useRefineError } from "@/shared/lib/use-refine-error"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  UpdatePartyroomMetaSchema,
  type UpdatePartyroomMetaRequest,
} from "@/features/partyrooms/model/mutation-schema"
import { useUpdatePartyroomMeta } from "@/features/partyrooms/api/use-update-partyroom-meta"

interface Props {
  partyroomId: number
  currentTitle: string
  currentIntroduction: string | null
  currentPlaybackTimeLimit: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpdateMetaDialog({
  partyroomId,
  currentTitle,
  currentIntroduction,
  currentPlaybackTimeLimit,
  open,
  onOpenChange,
}: Props) {
  const mutation = useUpdatePartyroomMeta()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdatePartyroomMetaRequest>({
    resolver: zodResolver(UpdatePartyroomMetaSchema),
    defaultValues: { title: undefined, introduction: undefined, playbackTimeLimit: undefined },
  })

  useDialogResetEffect(open, () => {
    mutation.reset()
    reset()
  })

  const onSubmit = (data: UpdatePartyroomMetaRequest) => {
    const body: UpdatePartyroomMetaRequest = {
      title: data.title?.trim() || undefined,
      introduction: data.introduction?.trim() || undefined,
      playbackTimeLimit: data.playbackTimeLimit ?? undefined,
    }
    mutation.mutate(
      { partyroomId, body },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  const refineError = useRefineError(errors)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>파티룸 메타 수정</DialogTitle>
            <DialogDescription>
              변경할 필드만 입력하세요. 입력하지 않은 필드는 유지됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="meta-title">제목</Label>
              <Input
                id="meta-title"
                aria-label="제목"
                placeholder={currentTitle}
                maxLength={100}
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="meta-intro">소개</Label>
              <Textarea
                id="meta-intro"
                aria-label="소개"
                placeholder={currentIntroduction ?? ""}
                maxLength={500}
                rows={3}
                {...register("introduction")}
              />
              {errors.introduction && (
                <p className="text-sm text-destructive">{errors.introduction.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="meta-limit">재생 시간 제한 (분, 1~60)</Label>
              <Input
                id="meta-limit"
                aria-label="재생 시간 제한"
                type="number"
                min={1}
                max={60}
                placeholder={currentPlaybackTimeLimit?.toString() ?? ""}
                {...register("playbackTimeLimit")}
              />
              {errors.playbackTimeLimit && (
                <p className="text-sm text-destructive">{errors.playbackTimeLimit.message}</p>
              )}
            </div>
            {refineError && (
              <p className="text-sm text-destructive">{refineError.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "처리 중..." : "수정"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
