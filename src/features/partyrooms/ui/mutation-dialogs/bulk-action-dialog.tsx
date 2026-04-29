import { useEffect, useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useBulkPartyroomAction } from "@/features/partyrooms/api/use-bulk-partyroom-action"
import type {
  BulkActionType,
  BulkActionResult,
} from "@/features/partyrooms/model/bulk-schema"

const ACTION_OPTIONS: { value: BulkActionType; label: string }[] = [
  { value: "TERMINATE", label: "강제 종료 (TERMINATE)" },
  { value: "SUSPEND", label: "일시 정지 (SUSPEND)" },
  { value: "SET_HIDDEN", label: "표시 숨김 (SET_HIDDEN)" },
]

interface Props {
  selectedIds: number[]
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * mutation 성공 시 results 전달 — widget이 selection clear + (실패 있으면 result dialog open)
   * 분기. spec §4.3: selection clear는 onSuccess 즉시, result dialog는 widget이 자체 state로 분기.
   */
  onResults: (results: BulkActionResult[]) => void
}

export function BulkActionDialog({
  selectedIds,
  open,
  onOpenChange,
  onResults,
}: Props) {
  const [action, setAction] = useState<BulkActionType>("TERMINATE")
  const [reason, setReason] = useState("")
  const [skipErrors, setSkipErrors] = useState(true)
  const mutation = useBulkPartyroomAction()

  // 모달 close 시 form reset (R11 폴리시)
  useEffect(() => {
    if (!open) {
      setAction("TERMINATE")
      setReason("")
      setSkipErrors(true)
      mutation.reset()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const submitDisabled = reason.trim().length === 0 || mutation.isPending

  // close 차단 — isPending 동안만 (spec §4.3)
  const handleOpenChange = (next: boolean) => {
    if (mutation.isPending && !next) return
    onOpenChange(next)
  }

  const handleSubmit = () => {
    if (submitDisabled) return
    mutation.mutate(
      {
        partyroomIds: selectedIds,
        action,
        reason: reason.trim(),
        skipErrors,
      },
      {
        onSuccess: (response) => {
          // 항상 호출 — widget이 selection clear + 실패 분기 결정 (spec §4.3)
          onResults(response.results)
          onOpenChange(false)
        },
      },
    )
  }

  const previewIds =
    selectedIds.length <= 6
      ? selectedIds.join(", ")
      : `${selectedIds.slice(0, 5).join(", ")} 외 ${selectedIds.length - 5}건`

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>일괄 처리 ({selectedIds.length}건)</DialogTitle>
          <DialogDescription>
            선택된 ID: <span className="text-foreground">{previewIds}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="bulk-action">액션</Label>
            <Select
              value={action}
              onValueChange={(v) => setAction(v as BulkActionType)}
            >
              <SelectTrigger id="bulk-action" aria-label="액션 선택" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="bulk-reason">사유</Label>
            <Textarea
              id="bulk-reason"
              aria-label="사유"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="처리 사유 (필수, 1~500자)"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="bulk-skip-errors"
              checked={skipErrors}
              onCheckedChange={(c) => setSkipErrors(c === true)}
              aria-label="실패 시 계속 진행"
            />
            <Label
              htmlFor="bulk-skip-errors"
              className="text-sm font-normal cursor-pointer"
            >
              한 항목 실패 시에도 계속 진행 (권장)
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={submitDisabled}>
            {mutation.isPending ? "처리 중..." : "일괄 처리"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
