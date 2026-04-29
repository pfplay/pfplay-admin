import { useParams, Link } from "react-router-dom"
import { useAvatarDetail } from "@/features/avatars/api/use-avatar-detail"
import { AvatarDetailCards } from "@/features/avatars/ui/avatar-detail-cards"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/shared/api/error"
import type { AvatarResourceType } from "@/entities/avatar"

export function AvatarsDetailWidget() {
  const { resourceType: urlType, id: idParam } = useParams<{
    resourceType: "bodies" | "faces"
    id: string
  }>()
  const resourceType: AvatarResourceType = urlType === "faces" ? "face" : "body"
  const id = Number(idParam)
  const idValid = Number.isFinite(id) && id > 0

  const { data, isLoading, error } = useAvatarDetail({
    resourceType,
    id: idValid ? id : 0,
  })

  if (!idValid) return <NotFoundView resourceType={resourceType} />
  if (error instanceof ApiError && error.status === 404) {
    return <NotFoundView resourceType={resourceType} />
  }
  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }
  if (!data) return null

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-4">
        <Link
          to={`/avatars/${resourceType === "body" ? "bodies" : "faces"}`}
          className="text-sm text-muted-foreground inline-block"
        >
          ← 목록으로
        </Link>
        {/* G6에서 AvatarsActionsDropdown wire */}
      </div>
      <AvatarDetailCards detail={data} />
    </div>
  )
}

function NotFoundView({ resourceType }: { resourceType: AvatarResourceType }) {
  return (
    <div className="p-6 lg:p-8 text-center space-y-4">
      <h2 className="text-xl font-bold">아바타 리소스를 찾을 수 없습니다</h2>
      <p className="text-muted-foreground text-sm">
        잘못된 ID이거나 삭제된 리소스입니다.
      </p>
      <Link to={`/avatars/${resourceType === "body" ? "bodies" : "faces"}`}>
        <Button variant="outline">목록으로</Button>
      </Link>
    </div>
  )
}
