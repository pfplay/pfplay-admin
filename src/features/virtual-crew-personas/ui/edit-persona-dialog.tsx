import { useEffect } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  updatePersonaSchema,
  type UpdatePersonaRequest,
} from "../model/persona-schema"
import { usePersona } from "../api/use-persona"
import { useUpdatePersona } from "../api/use-update-persona"

interface Props {
  personaId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditPersonaDialog({ personaId, open, onOpenChange }: Props) {
  const detail = usePersona(personaId, open)
  const mutation = useUpdatePersona()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UpdatePersonaRequest>({
    resolver: zodResolver(updatePersonaSchema),
    defaultValues: { name: "", instruction: "", active: true },
  })

  useDialogResetEffect(open, () => mutation.reset())

  // 상세 로딩 완료 시 폼에 기존 값 주입.
  useEffect(() => {
    if (detail.data) {
      reset({
        name: detail.data.name,
        instruction: detail.data.instruction,
        active: detail.data.active,
      })
    }
  }, [detail.data, reset])

  const active = watch("active")

  const onSubmit = (data: UpdatePersonaRequest) =>
    mutation.mutate(
      { id: personaId, body: data },
      { onSuccess: () => onOpenChange(false) },
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>페르소나 수정</DialogTitle>
            <DialogDescription>
              페르소나의 이름·지시문·활성 여부를 변경합니다.
            </DialogDescription>
          </DialogHeader>
          {detail.isLoading ? (
            <div className="py-4 space-y-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : detail.isError ? (
            <p className="py-4 text-sm text-destructive">
              페르소나 정보를 불러오지 못했습니다.
            </p>
          ) : (
            <div className="py-4 space-y-3">
              <div className="space-y-1">
                <Label htmlFor="edit-persona-name">
                  이름 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-persona-name"
                  aria-label="이름"
                  maxLength={64}
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-persona-instruction">
                  지시문 <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="edit-persona-instruction"
                  aria-label="지시문"
                  maxLength={4000}
                  rows={8}
                  {...register("instruction")}
                />
                {errors.instruction && (
                  <p className="text-sm text-destructive">
                    {errors.instruction.message}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-persona-active"
                  checked={active}
                  onCheckedChange={(c) =>
                    setValue("active", c === true, { shouldDirty: true })
                  }
                />
                <Label htmlFor="edit-persona-active" className="cursor-pointer">
                  활성
                </Label>
              </div>
            </div>
          )}
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
              disabled={mutation.isPending || detail.isLoading || detail.isError}
            >
              {mutation.isPending ? "처리 중..." : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
