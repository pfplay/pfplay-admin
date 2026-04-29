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
import { UpdateMetaDialog } from "./mutation-dialogs/update-meta-dialog"
import { DisplayFlagDialog } from "./mutation-dialogs/display-flag-dialog"
import type { AdminPartyroomDetail } from "@/entities/partyroom/model/types"

type ActiveDialog = null | "terminate" | "suspend" | "restore" | "update-meta" | "display-flag"

const DISPLAY_FLAG_VALUES = ["NORMAL", "FEATURED", "HIDDEN"] as const
type DisplayFlag = (typeof DISPLAY_FLAG_VALUES)[number]

interface Props {
  partyroom: AdminPartyroomDetail
}

export function PartyroomsActionsDropdown({ partyroom }: Props) {
  const [active, setActive] = useState<ActiveDialog>(null)
  const status = partyroom.status

  const canTerminate = status === "ACTIVE" || status === "SUSPENDED"
  const canSuspend = status === "ACTIVE"
  const canRestore = status === "SUSPENDED"
  const canUpdateMeta = status === "ACTIVE" || status === "SUSPENDED"
  const canUpdateDisplayFlag = status === "ACTIVE" || status === "SUSPENDED"

  // 14b §9.1 forward-compat 정책: 알 수 없는 displayFlag 값은 NORMAL로 fallback
  const safeDisplayFlag: DisplayFlag = (DISPLAY_FLAG_VALUES as readonly string[]).includes(
    partyroom.displayFlag,
  )
    ? (partyroom.displayFlag as DisplayFlag)
    : "NORMAL"

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
            disabled={!canUpdateMeta}
            onSelect={() => canUpdateMeta && setActive("update-meta")}
          >
            메타 수정
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canUpdateDisplayFlag}
            onSelect={() => canUpdateDisplayFlag && setActive("display-flag")}
          >
            표시 변경
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canTerminate}
            onSelect={() => canTerminate && setActive("terminate")}
            className="text-destructive focus:text-destructive"
          >
            강제 종료
          </DropdownMenuItem>
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
      {/*
        14b AdminPartyroomDetail에 introduction/playbackTimeLimit 부재 (verified
        entities/partyroom/model/types.ts). placeholder 사용 안 함, 빈 form으로 시작.
        백엔드 DTO 확장은 spec §13.2 future polish.
      */}
      <UpdateMetaDialog
        partyroomId={partyroom.partyroomId}
        currentTitle={partyroom.title}
        currentIntroduction={null}
        currentPlaybackTimeLimit={null}
        open={active === "update-meta"}
        onOpenChange={(o) => !o && setActive(null)}
      />
      <DisplayFlagDialog
        partyroomId={partyroom.partyroomId}
        currentFlag={safeDisplayFlag}
        open={active === "display-flag"}
        onOpenChange={(o) => !o && setActive(null)}
      />
    </>
  )
}
