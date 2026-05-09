import { useEffect, useState } from "react"
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
import { useUpdatePartyroomDisplayFlag } from "@/features/partyrooms/api/use-update-partyroom-display-flag"
import { DISPLAY_FLAG_LABEL } from "@/shared/lib/labels"

type DisplayFlag = "NORMAL" | "FEATURED" | "HIDDEN"

const FLAG_OPTIONS: { value: DisplayFlag; label: string }[] = [
  { value: "NORMAL", label: "일반" },
  { value: "FEATURED", label: "추천" },
  { value: "HIDDEN", label: "숨김 처리" },
]

interface Props {
  partyroomId: number
  currentFlag: DisplayFlag
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DisplayFlagDialog({ partyroomId, currentFlag, open, onOpenChange }: Props) {
  const [selected, setSelected] = useState<DisplayFlag>(currentFlag)
  const mutation = useUpdatePartyroomDisplayFlag()

  useEffect(() => {
    if (open) setSelected(currentFlag)
  }, [open, currentFlag])

  useDialogResetEffect(open, () => mutation.reset())

  const unchanged = selected === currentFlag
  const submitDisabled = unchanged || mutation.isPending

  const handleSubmit = () => {
    if (submitDisabled) return
    mutation.mutate(
      { partyroomId, body: { flag: selected } },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>파티룸 표시 변경</DialogTitle>
          <DialogDescription>
            현재: <strong>{DISPLAY_FLAG_LABEL[currentFlag] ?? currentFlag}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Select
            value={selected}
            onValueChange={(v) => setSelected(v as DisplayFlag)}
          >
            <SelectTrigger aria-label="표시 선택" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FLAG_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={submitDisabled}>
            {mutation.isPending ? "처리 중..." : "변경"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
