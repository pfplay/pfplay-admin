import { useState } from "react"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { TransitionStatusDialog } from "./mutation-dialogs/transition-status-dialog"
import { canTransition } from "@/features/reports/model/transition-schema"
import type { ReportStatus } from "@/entities/report"

interface Props {
  reportId: number
  currentStatus: ReportStatus
}

export function ReportsActionsDropdown({ reportId, currentStatus }: Props) {
  const [target, setTarget] = useState<ReportStatus | null>(null)

  const items: { target: ReportStatus; label: string; destructive?: boolean }[] = [
    { target: "REVIEWING", label: "검토 시작" },
    { target: "RESOLVED", label: "처리 완료" },
    { target: "DISMISSED", label: "기각", destructive: true },
    { target: "PENDING", label: "보류" },
  ]

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" aria-label="작업">
            작업 <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {items.map((item) => {
            const enabled = canTransition(currentStatus, item.target)
            return (
              <DropdownMenuItem
                key={item.target}
                disabled={!enabled}
                onSelect={() => enabled && setTarget(item.target)}
                className={
                  item.destructive ? "text-destructive focus:text-destructive" : ""
                }
              >
                {item.label}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {target !== null && (
        <TransitionStatusDialog
          reportId={reportId}
          currentStatus={currentStatus}
          target={target}
          open={target !== null}
          onOpenChange={(o) => !o && setTarget(null)}
        />
      )}
    </>
  )
}
