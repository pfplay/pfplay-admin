import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import {
  membersListQuerySchema,
  type MembersListQuery,
} from "@/features/members/model/filter-schema"
import { useMembersList } from "@/features/members/api/use-members-list"
import { MembersFilterForm } from "@/features/members/ui/members-filter-form"
import { MembersTable } from "@/features/members/ui/members-table"
import {
  parseSearchParams,
  stripInvalidParams,
  serializeQuery,
} from "@/shared/lib/url-state"
import { Pagination } from "@/widgets/pagination"
import { ApiError } from "@/shared/api/error"

export function MembersListWidget() {
  const [params, setParams] = useSearchParams()
  const parsed = parseSearchParams(membersListQuerySchema, params)

  // invalid query → drop invalid params + toast (effect — render 중 setParams 금지)
  useEffect(() => {
    if (!parsed.success) {
      const cleaned = stripInvalidParams(params, parsed.error)
      setParams(cleaned, { replace: true })
      toast.error("필터 일부가 잘못돼 무시했어요")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed.success])

  if (!parsed.success) return null

  const query: MembersListQuery = parsed.data
  return <MembersListContent query={query} setParams={setParams} />
}

interface ContentProps {
  query: MembersListQuery
  setParams: ReturnType<typeof useSearchParams>[1]
}

function MembersListContent({ query, setParams }: ContentProps) {
  const { data, isLoading, error } = useMembersList(query)

  const updateQuery = (next: Partial<MembersListQuery>) => {
    const merged = { ...query, ...next }
    setParams(serializeQuery(merged as Record<string, unknown>))
  }
  const reset = () => setParams(new URLSearchParams())
  const goToPage = (page: number) => updateQuery({ page })

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">회원</h2>
        {data && (
          <p className="text-sm text-muted-foreground">
            총 {data.totalElements}건
          </p>
        )}
      </div>
      <MembersFilterForm query={query} onChange={updateQuery} onReset={reset} />
      {error instanceof ApiError && error.status === 403 && (
        <p className="text-destructive text-sm mb-2">
          이 화면을 볼 권한이 없습니다
        </p>
      )}
      <MembersTable
        rows={data?.content ?? []}
        isLoading={isLoading}
        isEmpty={!isLoading && (data?.empty ?? false)}
      />
      {data && (
        <Pagination
          page={data.number}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          onChange={goToPage}
        />
      )}
    </div>
  )
}
