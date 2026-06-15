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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { usePersonas } from "@/features/virtual-dj-personas/api/use-personas"
import {
  useAssignPersona,
  useUnassignPersona,
} from "../api/use-assign-persona"

interface Props {
  /** 일괄 매핑 대상 봇 userId 목록 */
  botIds: number[]
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 적용 성공(invalidate 후) 시 호출 — 부모가 선택 해제 등 처리 */
  onApplied?: () => void
}

/**
 * 선택된 봇들에 페르소나를 일괄 지정하거나 해제한다.
 * 일괄 다이얼로그 UX 계승: close 시 reset, pending 중 close 차단, 성공 시 적용 수 요약.
 * 비활성 페르소나는 선택지에서 disabled 로 노출한다.
 */
export function AssignPersonaDialog({
  botIds,
  open,
  onOpenChange,
  onApplied,
}: Props) {
  const [personaId, setPersonaId] = useState<string>("")
  const {
    data: personas,
    isError: personasError,
    isLoading: personasLoading,
  } = usePersonas()
  const activePersonaCount = (personas ?? []).filter((p) => p.active).length
  const assign = useAssignPersona()
  const unassign = useUnassignPersona()

  const pending = assign.isPending || unassign.isPending
  const result = assign.data ?? unassign.data

  useDialogResetEffect(open, () => {
    setPersonaId("")
    assign.reset()
    unassign.reset()
  })

  const handleOpenChange = (next: boolean) => {
    if (pending && !next) return
    onOpenChange(next)
  }

  const handleAssign = () => {
    if (personaId === "" || botIds.length === 0) return
    assign.mutate(
      { botIds, personaId: Number(personaId) },
      { onSuccess: () => onApplied?.() },
    )
  }

  const handleUnassign = () => {
    if (botIds.length === 0) return
    unassign.mutate(botIds, { onSuccess: () => onApplied?.() })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>페르소나 일괄 지정 ({botIds.length}명)</DialogTitle>
          <DialogDescription>
            선택한 봇들에 페르소나를 지정하거나, 매핑을 해제합니다.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-2 py-2" role="status">
            <p className="text-sm font-medium text-foreground">
              {result.applied}명에게 적용했습니다.
            </p>
          </div>
        ) : personasLoading ? (
          <p className="py-2 text-sm text-muted-foreground">
            페르소나 목록을 불러오는 중...
          </p>
        ) : personasError ? (
          <p className="py-2 text-sm text-destructive">
            페르소나 목록을 불러오지 못했습니다. (매핑 해제는 가능합니다)
          </p>
        ) : activePersonaCount === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            지정할 수 있는 활성 페르소나가 없습니다. 먼저 페르소나를
            생성·활성화하세요. (매핑 해제는 가능합니다)
          </p>
        ) : (
          <div className="py-2">
            <Select value={personaId} onValueChange={setPersonaId}>
              <SelectTrigger className="w-full" aria-label="페르소나 선택">
                <SelectValue placeholder="페르소나를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {(personas ?? []).map((p) => (
                  <SelectItem
                    key={p.id}
                    value={String(p.id)}
                    disabled={!p.active}
                  >
                    {p.name}
                    {!p.active ? " (비활성)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button type="button" onClick={() => handleOpenChange(false)}>
              닫기
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={pending}
              >
                취소
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleUnassign}
                disabled={pending || botIds.length === 0}
              >
                {unassign.isPending ? "해제 중..." : "해제"}
              </Button>
              <Button
                onClick={handleAssign}
                disabled={pending || personaId === "" || botIds.length === 0}
              >
                {assign.isPending ? "지정 중..." : "지정"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
