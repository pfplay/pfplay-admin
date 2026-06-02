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
  createPersonaSchema,
  type CreatePersonaRequest,
} from "../model/persona-schema"
import { useCreatePersona } from "../api/use-create-persona"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreatePersonaDialog({ open, onOpenChange }: Props) {
  const mutation = useCreatePersona()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreatePersonaRequest>({
    resolver: zodResolver(createPersonaSchema),
    defaultValues: { name: "", instruction: "" },
  })

  useDialogResetEffect(open, () => {
    mutation.reset()
    reset()
  })

  const onSubmit = (data: CreatePersonaRequest) =>
    mutation.mutate(data, { onSuccess: () => onOpenChange(false) })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>페르소나 생성</DialogTitle>
            <DialogDescription>
              가상 DJ가 채팅에 응답할 때 사용할 페르소나를 만듭니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="persona-name">
                이름 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="persona-name"
                aria-label="이름"
                maxLength={64}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="persona-instruction">
                지시문 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="persona-instruction"
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
