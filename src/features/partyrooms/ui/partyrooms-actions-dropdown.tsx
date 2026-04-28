import { useState } from "react"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { TerminateDialog } from "./mutation-dialogs/terminate-dialog"
import { SuspendDialog } from "./mutation-dialogs/suspend-dialog"
import { RestoreDialog } from "./mutation-dialogs/restore-dialog"
import type { AdminPartyroomDetail } from "@/entities/partyroom/model/types"

type ActiveDialog = null | "terminate" | "suspend" | "restore" | "update-meta" | "display-flag"
// G4: update-meta, G5: display-flag — 후속 chunk에서 추가

interface Props {
  partyroom: AdminPartyroomDetail
}

export function PartyroomsActionsDropdown({ partyroom }: Props) {
  const [active, setActive] = useState<ActiveDialog>(null)
  const status = partyroom.status

  const canTerminate = status === "ACTIVE" || status === "SUSPENDED"
  const canSuspend = status === "ACTIVE"
  const canRestore = status === "SUSPENDED"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" aria-label="Actions">
            Actions <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={!canSuspend}
            onSelect={() => canSuspend && setActive("suspend")}
          >
            일시 정지
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canRestore}
            onSelect={() => canRestore && setActive("restore")}
          >
            재개
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canTerminate}
            onSelect={() => canTerminate && setActive("terminate")}
            className="text-destructive focus:text-destructive"
          >
            강제 종료
          </DropdownMenuItem>
          {/* G4: 메타 수정, G5: 표시 변경 — 후속 chunk에서 추가 */}
        </DropdownMenuContent>
      </DropdownMenu>

      <TerminateDialog
        partyroomId={partyroom.partyroomId}
        open={active === "terminate"}
        onOpenChange={(o) => !o && setActive(null)}
      />
      <SuspendDialog
        partyroomId={partyroom.partyroomId}
        open={active === "suspend"}
        onOpenChange={(o) => !o && setActive(null)}
      />
      <RestoreDialog
        partyroomId={partyroom.partyroomId}
        open={active === "restore"}
        onOpenChange={(o) => !o && setActive(null)}
      />
    </>
  )
}
