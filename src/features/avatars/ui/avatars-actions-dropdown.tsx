import { useState } from "react"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { PublishAvatarDialog } from "./mutation-dialogs/publish-avatar-dialog"
import { RetireAvatarDialog } from "./mutation-dialogs/retire-avatar-dialog"
import type {
  AdminAvatarBodyView,
  AdminAvatarFaceView,
  AvatarResourceType,
} from "@/entities/avatar"

type ActiveDialog = null | "publish" | "retire"

interface Props {
  resource: AdminAvatarBodyView | AdminAvatarFaceView
  resourceType: AvatarResourceType
}

export function AvatarsActionsDropdown({ resource, resourceType }: Props) {
  const [active, setActive] = useState<ActiveDialog>(null)
  const status = resource.lifecycleStatus

  const canPublish = status === "DRAFT"
  const canRetire = status === "PUBLISHED"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" aria-label="작업">
            작업 <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={!canPublish}
            onSelect={() => canPublish && setActive("publish")}
          >
            게시 (DRAFT → PUBLISHED)
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canRetire}
            onSelect={() => canRetire && setActive("retire")}
            className="text-destructive focus:text-destructive"
          >
            회수 (PUBLISHED → RETIRED)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PublishAvatarDialog
        resourceType={resourceType}
        id={resource.id}
        name={resource.name}
        open={active === "publish"}
        onOpenChange={(o) => !o && setActive(null)}
      />
      <RetireAvatarDialog
        resourceType={resourceType}
        id={resource.id}
        name={resource.name}
        open={active === "retire"}
        onOpenChange={(o) => !o && setActive(null)}
      />
    </>
  )
}
