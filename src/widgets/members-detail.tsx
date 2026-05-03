import { useParams, Link } from "react-router-dom"
import { useMemberDetail } from "@/features/members/api/use-member-detail"
import { MemberDetailCards } from "@/features/members/ui/member-detail-cards"
import { MembersActionsDropdown } from "@/features/members/ui/members-actions-dropdown"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/shared/api/error"

export function MembersDetailWidget() {
  const { memberId } = useParams<{ memberId: string }>()
  const id = Number(memberId)
  const idValid = Number.isFinite(id) && id > 0
  const { data, isLoading, error } = useMemberDetail(idValid ? id : 0)

  if (!idValid) {
    return <NotFoundView />
  }
  if (error instanceof ApiError && error.status === 404) {
    return <NotFoundView />
  }
  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }
  if (!data) return null

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-4">
        <Link
          to="/members"
          className="text-sm text-muted-foreground inline-block"
        >
          ← 목록으로
        </Link>
        <MembersActionsDropdown
          memberId={data.memberId}
          currentTier={data.authorityTier}
          displayName={data.profile.nickname ?? data.userAccount.email}
          withdrawn={data.withdrawn}
        />
      </div>
      <MemberDetailCards detail={data} />
    </div>
  )
}

function NotFoundView() {
  return (
    <div className="p-6 lg:p-8">
      <h2 className="text-xl font-semibold text-muted-foreground mb-4">
        존재하지 않는 회원입니다
      </h2>
      <Button asChild variant="outline">
        <Link to="/members">목록으로</Link>
      </Button>
    </div>
  )
}
