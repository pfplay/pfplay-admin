import { useParams, Link } from "react-router-dom"
import { useAdministratorDetail } from "@/features/administrators/api/use-administrator-detail"
import { AdministratorDetailCards } from "@/features/administrators/ui/administrator-detail-cards"
import { AdministratorsActionsDropdown } from "@/features/administrators/ui/administrators-actions-dropdown"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/shared/api/error"

export function AdministratorDetailWidget() {
  const { administratorId } = useParams<{ administratorId: string }>()
  const id = Number(administratorId)
  const idValid = Number.isFinite(id) && id > 0
  const { data, isLoading, error } = useAdministratorDetail(idValid ? id : 0)

  if (!idValid) return <NotFoundView />
  if (error instanceof ApiError && error.status === 404) return <NotFoundView />
  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }
  // findAdministratorByIdFromList의 undefined도 NotFound로 처리
  if (!data) return <NotFoundView />

  return (
    <div className="p-6 lg:p-8">
      <div className="flex justify-end mb-4">
        <AdministratorsActionsDropdown administrator={data} />
      </div>
      <AdministratorDetailCards detail={data} />
    </div>
  )
}

function NotFoundView() {
  return (
    <div className="p-6 lg:p-8">
      <h2 className="text-xl font-semibold text-muted-foreground mb-4">
        존재하지 않는 어드민입니다
      </h2>
      <Button asChild variant="outline">
        <Link to="/administrators">목록으로</Link>
      </Button>
    </div>
  )
}
