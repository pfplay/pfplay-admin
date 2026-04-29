import {
  membersListQuerySchema,
  type MembersListQuery,
} from "@/features/members/model/filter-schema"
import { useMembersList } from "@/features/members/api/use-members-list"
import { MembersFilterForm } from "@/features/members/ui/members-filter-form"
import { MembersTable } from "@/features/members/ui/members-table"
import { useUrlQueryState } from "@/shared/lib/use-url-query-state"
import { Pagination } from "@/widgets/pagination"
import { ApiError } from "@/shared/api/error"

export function MembersListWidget() {
  const { query, setQuery, reset } = useUrlQueryState(membersListQuerySchema)

  if (query === null) return null
  return (
    <MembersListContent query={query} setQuery={setQuery} reset={reset} />
  )
}

interface ContentProps {
  query: MembersListQuery
  setQuery: (next: Partial<MembersListQuery>) => void
  reset: () => void
}

function MembersListContent({ query, setQuery, reset }: ContentProps) {
  const { data, isLoading, error } = useMembersList(query)
  const goToPage = (page: number) => setQuery({ page })

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
      <MembersFilterForm query={query} onChange={setQuery} onReset={reset} />
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
