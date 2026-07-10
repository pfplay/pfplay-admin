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
import { useDeletePersona } from "../api/use-delete-persona"

interface Props {
  personaId: number
  personaName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeletePersonaDialog({
  personaId,
  personaName,
  open,
  onOpenChange,
}: Props) {
  const mutation = useDeletePersona()

  useDialogResetEffect(open, () => mutation.reset())

  // 봇에 매핑된 페르소나는 백엔드가 409 PERSONA_IN_USE 로 거절 → mutationErrorToast 가 메시지를 노출한다.
  const handleSubmit = () =>
    mutation.mutate(personaId, { onSuccess: () => onOpenChange(false) })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>페르소나 삭제</DialogTitle>
          <DialogDescription>
            <strong>{personaName}</strong> 페르소나를 삭제합니다. 봇에 매핑되어
            사용 중인 페르소나는 삭제할 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "처리 중..." : "삭제"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
