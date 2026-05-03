import { useState } from "react"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChangeTierDialog } from "./mutation-dialogs/change-tier-dialog"
import { WithdrawDialog } from "./mutation-dialogs/withdraw-dialog"
import type { AuthorityTier } from "@/entities/member/model/types"

type ActiveDialog = null | "change-tier" | "withdraw"

interface Props {
  memberId: number
  currentTier: AuthorityTier
  displayName: string
  withdrawn?: boolean
}

export function MembersActionsDropdown({ memberId, currentTier, displayName, withdrawn = false }: Props) {
  const [active, setActive] = useState<ActiveDialog>(null)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" aria-label="작업">
            작업 <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setActive("change-tier")}>
            등급 변경
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              if (!withdrawn) setActive("withdraw")
            }}
            disabled={withdrawn}
            title={withdrawn ? "이미 탈퇴됨" : undefined}
            className="text-destructive focus:text-destructive"
          >
            비식별화 탈퇴
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangeTierDialog
        memberId={memberId}
        currentTier={currentTier}
        open={active === "change-tier"}
        onOpenChange={(open) => !open && setActive(null)}
      />
      <WithdrawDialog
        memberId={memberId}
        displayName={displayName}
        open={active === "withdraw"}
        onOpenChange={(open) => !open && setActive(null)}
      />
    </>
  )
}
