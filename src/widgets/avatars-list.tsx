import { useEffect } from "react"
import { useParams, useSearchParams, NavLink } from "react-router-dom"
import { toast } from "sonner"
import {
  bodyListQuerySchema,
  faceListQuerySchema,
  type BodyListQuery,
  type FaceListQuery,
} from "@/features/avatars/model/filter-schema"
import { useAvatarsList } from "@/features/avatars/api/use-avatars-list"
import { AvatarsFilterForm } from "@/features/avatars/ui/avatars-filter-form"
import { AvatarsTable } from "@/features/avatars/ui/avatars-table"
import {
  parseSearchParams,
  stripInvalidParams,
  serializeQuery,
} from "@/shared/lib/url-state"
import { ApiError } from "@/shared/api/error"
import { cn } from "@/shared/lib/utils"
import type { AvatarResourceType } from "@/entities/avatar"

export function AvatarsListWidget() {
  const { resourceType: urlType } = useParams<{ resourceType: "bodies" | "faces" }>()
  const resourceType: AvatarResourceType = urlType === "faces" ? "face" : "body"

  const [params, setParams] = useSearchParams()
  const schema = resourceType === "body" ? bodyListQuerySchema : faceListQuerySchema
  const parsed = parseSearchParams(schema, params)

  useEffect(() => {
    if (!parsed.success) {
      const cleaned = stripInvalidParams(params, parsed.error)
      setParams(cleaned, { replace: true })
      toast.error("필터 일부가 잘못돼 무시했어요")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed.success])

  if (!parsed.success) return null

  const query = parsed.data as BodyListQuery | FaceListQuery
  return (
    <Content resourceType={resourceType} query={query} setParams={setParams} />
  )
}

interface ContentProps {
  resourceType: AvatarResourceType
  query: BodyListQuery | FaceListQuery
  setParams: ReturnType<typeof useSearchParams>[1]
}

function Content({ resourceType, query, setParams }: ContentProps) {
  const { data, isLoading, error } = useAvatarsList(
    resourceType === "body"
      ? { resourceType, query: query as BodyListQuery }
      : { resourceType, query: query as FaceListQuery },
  )

  const updateQuery = (next: Partial<BodyListQuery & FaceListQuery>) => {
    const merged = { ...query, ...next }
    setParams(serializeQuery(merged as Record<string, unknown>))
  }
  const reset = () => setParams(new URLSearchParams())

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">아바타 카탈로그</h2>
        {data && (
          <p className="text-sm text-muted-foreground">총 {data.length}건</p>
        )}
      </div>
      <div className="mb-4 flex gap-2 border-b">
        <NavLink
          to="/avatars/bodies"
          className={({ isActive }) =>
            cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )
          }
        >
          Body
        </NavLink>
        <NavLink
          to="/avatars/faces"
          className={({ isActive }) =>
            cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )
          }
        >
          Face
        </NavLink>
      </div>
      <AvatarsFilterForm
        resourceType={resourceType}
        query={query}
        onChange={updateQuery}
        onReset={reset}
      />
      {error instanceof ApiError && error.status === 403 && (
        <p className="text-destructive text-sm mb-2">
          이 화면을 볼 권한이 없습니다 (SUPER_ADMIN 필요)
        </p>
      )}
      <AvatarsTable
        resourceType={resourceType}
        rows={data ?? []}
        isLoading={isLoading}
        isEmpty={!isLoading && (data?.length ?? 0) === 0}
      />
    </div>
  )
}
