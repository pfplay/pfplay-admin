import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ANNOUNCEMENT_TYPE } from "@/shared/lib/labels"
import { useAdjustSchedule } from "../api/use-adjust-schedule"
import type { Announcement } from "@/entities/announcement"

interface Props {
  target: Announcement | null
  onOpenChange: (open: boolean) => void
}

/** Strip seconds from "YYYY-MM-DDTHH:mm:ss" → "YYYY-MM-DDTHH:mm" for datetime-local input. */
function toInputValue(isoLocal: string): string {
  // Take up to the first 16 chars (YYYY-MM-DDTHH:mm)
  return isoLocal.slice(0, 16)
}

/** Normalize datetime-local value "YYYY-MM-DDTHH:mm" → "YYYY-MM-DDTHH:mm:ss" for backend. */
function normalizeToSeconds(inputValue: string): string {
  if (inputValue.length === 16) return `${inputValue}:00`
  return inputValue
}

const QUICK_DELTAS: { label: string; minutes: number }[] = [
  { label: "+10분", minutes: 10 },
  { label: "+30분", minutes: 30 },
  { label: "+1시간", minutes: 60 },
]

export function AdjustScheduleDialog({ target, onOpenChange }: Props) {
  const mutation = useAdjustSchedule()
  const open = target !== null

  const initialValue = target ? toInputValue(target.scheduledEndAt ?? "") : ""
  const [inputValue, setInputValue] = useState(initialValue)

  // Reset input value whenever target changes
  useEffect(() => {
    if (target?.scheduledEndAt) {
      setInputValue(toInputValue(target.scheduledEndAt))
    }
  }, [target])

  const handleQuickAdd = (minutes: number) => {
    if (!inputValue) return
    const current = new Date(inputValue)
    if (isNaN(current.getTime())) return
    current.setMinutes(current.getMinutes() + minutes)
    const pad = (n: number) => String(n).padStart(2, "0")
    const next = `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}T${pad(current.getHours())}:${pad(current.getMinutes())}`
    setInputValue(next)
  }

  const handleConfirm = () => {
    if (!target) return
    mutation.mutate(
      { id: target.id, scheduledEndAt: normalizeToSeconds(inputValue) },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (mutation.isPending && !o) return
        onOpenChange(o)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>종료 시각 조정</DialogTitle>
          <DialogDescription>
            {target ? (
              <>
                <code className="font-mono">#{target.id}</code>{" "}
                {ANNOUNCEMENT_TYPE.label[target.type]} —{" "}
                <span className="font-medium">{target.titleKo}</span>의 점검
                종료 시각을 조정합니다.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label htmlFor="adjust-schedule-end">종료 시각</Label>
            <input
              id="adjust-schedule-end"
              type="datetime-local"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={mutation.isPending}
            />
          </div>
          <div className="flex gap-2">
            {QUICK_DELTAS.map(({ label, minutes }) => (
              <Button
                key={label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAdd(minutes)}
                disabled={mutation.isPending}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            돌아가기
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={mutation.isPending || !inputValue}
          >
            {mutation.isPending ? "처리 중..." : "확정"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
