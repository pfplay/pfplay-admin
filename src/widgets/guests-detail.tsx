import { useParams, Link } from "react-router-dom"
import { useGuestDetail } from "@/features/guests/api/use-guest-detail"
import { GuestDetailCards } from "@/features/guests/ui/guest-detail-cards"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/shared/api/error"

export function GuestsDetailWidget() {
  const { guestId } = useParams<{ guestId: string }>()
  const id = Number(guestId)
  const idValid = Number.isFinite(id) && id > 0
  const { data, isLoading, error } = useGuestDetail(idValid ? id : 0)

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
          to="/members?tab=guest"
          className="text-sm text-muted-foreground inline-block"
        >
          ← 목록으로
        </Link>
        {/* mutation dropdown 없음 — read-only invariant (D/#8 §5.1) */}
      </div>
      <GuestDetailCards detail={data} />
    </div>
  )
}

function NotFoundView() {
  return (
    <div className="p-6 lg:p-8">
      <h2 className="text-xl font-semibold text-muted-foreground mb-4">
        존재하지 않는 게스트입니다
      </h2>
      <Button asChild variant="outline">
        <Link to="/members?tab=guest">목록으로</Link>
      </Button>
    </div>
  )
}
