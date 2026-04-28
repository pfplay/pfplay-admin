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
import { useChangeMemberTier } from "@/features/members/api/use-change-member-tier"
import type { AuthorityTier } from "@/entities/member/model/types"

interface Props {
  memberId: number
  currentTier: AuthorityTier
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TIER_OPTIONS: { value: AuthorityTier; label: string }[] = [
  { value: "FM", label: "FM (정회원)" },
  { value: "AM", label: "AM (준회원)" },
  { value: "GT", label: "GT (강등)" },
]

export function ChangeTierDialog({ memberId, currentTier, open, onOpenChange }: Props) {
  const [selected, setSelected] = useState<AuthorityTier>(currentTier)
  const mutation = useChangeMemberTier()

  // Reset selection whenever the dialog opens or currentTier changes
  useEffect(() => {
    if (open) setSelected(currentTier)
  }, [open, currentTier])

  const unchanged = selected === currentTier
  const submitDisabled = unchanged || mutation.isPending

  const handleSubmit = () => {
    if (submitDisabled) return
    mutation.mutate(
      { memberId, tier: selected },
      {
        onSuccess: () => onOpenChange(false),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>회원 등급 변경</DialogTitle>
          <DialogDescription>
            현재 등급: <strong>{currentTier}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Select
            value={selected}
            onValueChange={(v) => setSelected(v as AuthorityTier)}
          >
            <SelectTrigger aria-label="등급 선택" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIER_OPTIONS.map((opt) => (
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
            변경
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
