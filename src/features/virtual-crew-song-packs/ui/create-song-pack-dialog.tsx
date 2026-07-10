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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  createSongPackSchema,
  type CreateSongPackRequest,
} from "../model/song-pack-schema"
import { useCreateSongPack } from "../api/use-create-song-pack"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateSongPackDialog({ open, onOpenChange }: Props) {
  const mutation = useCreateSongPack()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateSongPackRequest>({
    resolver: zodResolver(createSongPackSchema),
    defaultValues: { name: "", description: "" },
  })

  useDialogResetEffect(open, () => {
    mutation.reset()
    reset()
  })

  const onSubmit = (data: CreateSongPackRequest) =>
    mutation.mutate(
      { name: data.name, description: data.description?.trim() || null },
      { onSuccess: () => onOpenChange(false) },
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>송팩 생성</DialogTitle>
            <DialogDescription>
              새 송팩을 만듭니다. 트랙은 생성 후 빌더에서 추가합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="pack-name">
                이름 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pack-name"
                aria-label="이름"
                maxLength={100}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="pack-description">설명</Label>
              <Textarea
                id="pack-description"
                aria-label="설명"
                maxLength={500}
                rows={3}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
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
              {mutation.isPending ? "처리 중..." : "생성"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
