import { useState } from "react"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { UpdateNicknameDialog } from "./mutation-dialogs/update-nickname-dialog"
import { RevokeAdministratorDialog } from "./mutation-dialogs/revoke-administrator-dialog"
import { ResetPasswordDialog } from "./mutation-dialogs/reset-password-dialog"
import { AttachMemberProfileDialog } from "./mutation-dialogs/attach-member-profile-dialog"
import type { AdministratorView } from "@/entities/administrator"

type ActiveDialog =
  | null
  | "update-nickname"
  | "revoke"
  | "reset-password"
  | "attach-member"

interface Props {
  administrator: AdministratorView
}

export function AdministratorsActionsDropdown({ administrator }: Props) {
  const [active, setActive] = useState<ActiveDialog>(null)

  const isRevoked = administrator.revokedAt !== null
  const hasMember = administrator.memberId !== null

  // 회수된 어드민은 모든 mutation 차단 (backend도 reject 가능하나 UX 명확)
  const canUpdateNickname = !isRevoked && hasMember
  const canRevoke = !isRevoked
  const canResetPassword = !isRevoked
  const canAttachMember = !isRevoked && !hasMember

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
            disabled={!canUpdateNickname}
            onSelect={() => canUpdateNickname && setActive("update-nickname")}
            title={
              !hasMember
                ? "멤버 프로필 연결 후 닉네임 변경 가능"
                : isRevoked
                  ? "회수된 어드민은 수정 불가"
                  : undefined
            }
          >
            닉네임 변경
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canAttachMember}
            onSelect={() => canAttachMember && setActive("attach-member")}
            title={
              hasMember
                ? "이미 연결된 멤버 프로필 있음"
                : isRevoked
                  ? "회수된 어드민은 수정 불가"
                  : undefined
            }
          >
            멤버 프로필 연결
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canResetPassword}
            onSelect={() => canResetPassword && setActive("reset-password")}
          >
            비밀번호 리셋
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canRevoke}
            onSelect={() => canRevoke && setActive("revoke")}
            className="text-destructive focus:text-destructive"
          >
            권한 회수
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UpdateNicknameDialog
        administratorId={administrator.administratorId}
        currentNickname={administrator.nickname}
        open={active === "update-nickname"}
        onOpenChange={(o) => !o && setActive(null)}
      />
      <AttachMemberProfileDialog
        administratorId={administrator.administratorId}
        email={administrator.email}
        open={active === "attach-member"}
        onOpenChange={(o) => !o && setActive(null)}
      />
      <ResetPasswordDialog
        administratorId={administrator.administratorId}
        email={administrator.email}
        open={active === "reset-password"}
        onOpenChange={(o) => !o && setActive(null)}
      />
      <RevokeAdministratorDialog
        administratorId={administrator.administratorId}
        email={administrator.email}
        open={active === "revoke"}
        onOpenChange={(o) => !o && setActive(null)}
      />
    </>
  )
}
