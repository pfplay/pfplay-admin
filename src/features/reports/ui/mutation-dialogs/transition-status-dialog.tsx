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
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useUpdateReportStatus } from "@/features/reports/api/use-update-report-status"
import { TERMINAL_STATUSES } from "@/features/reports/model/transition-schema"
import type { ReportStatus } from "@/entities/report"

const STATUS_LABEL: Record<ReportStatus, string> = {
  PENDING: "보류",
  REVIEWING: "검토 중",
  RESOLVED: "처리 완료",
  DISMISSED: "기각",
}

interface Props {
  reportId: number
  currentStatus: ReportStatus
  /** menuitem이 직접 결정 — Dialog 내부 Select 회피 (14c §14 entry 14 jsdom hang) */
  target: ReportStatus
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransitionStatusDialog({
  reportId,
  currentStatus,
  target,
  open,
  onOpenChange,
}: Props) {
  const [note, setNote] = useState("")
  const mutation = useUpdateReportStatus()
  const isTerminal = TERMINAL_STATUSES.has(target)
  const noteRequired = isTerminal
  const noteValid = !noteRequired || note.trim().length >= 1

  useDialogResetEffect(open, () => {
    setNote("")
    mutation.reset()
  })

  const handleOpenChange = (next: boolean) => {
    if (mutation.isPending && !next) return
    onOpenChange(next)
  }

  const handleSubmit = () => {
    if (!noteValid || mutation.isPending) return
    mutation.mutate(
      {
        reportId,
        body: {
          status: target,
          resolutionNote: noteRequired ? note.trim() : note.trim() || null,
        },
      },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>신고 처리 — {STATUS_LABEL[target]}</DialogTitle>
          <DialogDescription>
            {STATUS_LABEL[currentStatus]} → <strong>{STATUS_LABEL[target]}</strong>{" "}
            전이 처리합니다.
          </DialogDescription>
        </DialogHeader>
        {noteRequired && (
          <div className="py-2 space-y-1">
            <Label htmlFor="transition-note">
              처리 메모 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="transition-note"
              aria-label="처리 메모"
              aria-required="true"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="처리 사유 (필수, 최대 2000자)"
            />
            {!noteValid && note.length > 0 && (
              <p className="text-sm text-destructive">처리 메모는 필수입니다</p>
            )}
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!noteValid || mutation.isPending}
          >
            {mutation.isPending ? "처리 중..." : "처리"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
