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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  renameSongPackSchema,
  type RenameSongPackRequest,
} from "../model/song-pack-schema"
import { useRenameSongPack } from "../api/use-rename-song-pack"

interface Props {
  packId: number
  currentName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RenameSongPackDialog({
  packId,
  currentName,
  open,
  onOpenChange,
}: Props) {
  const mutation = useRenameSongPack()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RenameSongPackRequest>({
    resolver: zodResolver(renameSongPackSchema),
    defaultValues: { name: currentName },
  })

  useDialogResetEffect(open, () => {
    mutation.reset()
    reset({ name: currentName })
  })

  const onSubmit = (data: RenameSongPackRequest) =>
    mutation.mutate(
      { id: packId, body: { name: data.name } },
      { onSuccess: () => onOpenChange(false) },
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>송팩 이름 변경</DialogTitle>
            <DialogDescription>송팩의 이름을 변경합니다.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="rename-pack-name">
              이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="rename-pack-name"
              aria-label="이름"
              maxLength={100}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
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
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "처리 중..." : "변경"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
