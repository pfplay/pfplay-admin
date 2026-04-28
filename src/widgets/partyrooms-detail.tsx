import { useParams, Link } from "react-router-dom"
import { usePartyroomDetail } from "@/features/partyrooms/api/use-partyroom-detail"
import { PartyroomDetailCards } from "@/features/partyrooms/ui/partyroom-detail-cards"
import { PartyroomsActionsDropdown } from "@/features/partyrooms/ui/partyrooms-actions-dropdown"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/shared/api/error"

export function PartyroomsDetailWidget() {
  const { partyroomId } = useParams<{ partyroomId: string }>()
  const id = Number(partyroomId)
  const idValid = Number.isFinite(id) && id > 0
  const { data, isLoading, error } = usePartyroomDetail(idValid ? id : 0)

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
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }
  if (!data) return null

  return (
    <div className="p-6 lg:p-8">
      <div className="flex justify-end mb-4">
        <PartyroomsActionsDropdown partyroom={data} />
      </div>
      <PartyroomDetailCards detail={data} />
    </div>
  )
}

function NotFoundView() {
  return (
    <div className="p-6 lg:p-8">
      <h2 className="text-xl font-semibold text-muted-foreground mb-4">
        존재하지 않는 파티룸입니다
      </h2>
      <Button asChild variant="outline">
        <Link to="/partyrooms">목록으로</Link>
      </Button>
    </div>
  )
}
