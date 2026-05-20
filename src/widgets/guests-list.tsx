import {
  guestsListQuerySchema,
  type GuestsListQuery,
} from "@/features/guests/model/filter-schema"
import { useGuestsList } from "@/features/guests/api/use-guests-list"
import { GuestsFilterForm } from "@/features/guests/ui/guests-filter-form"
import { GuestsTable } from "@/features/guests/ui/guests-table"
import { useUrlQueryState } from "@/shared/lib/use-url-query-state"
import { Pagination } from "@/widgets/pagination"
import { ApiError } from "@/shared/api/error"

export function GuestsListWidget() {
  // preserveExternalKeys: ["tab"] — members-page Tabs 컨테이너의 ?tab=guest 가
  // setQuery 시 사라지는 것 방지 (default tab=member 로의 강제 복귀 방지)
  const { query, setQuery, reset } = useUrlQueryState(guestsListQuerySchema, {
    preserveExternalKeys: ["tab"],
  })

  if (query === null) return null
  return <GuestsListContent query={query} setQuery={setQuery} reset={reset} />
}

interface ContentProps {
  query: GuestsListQuery
  setQuery: (next: Partial<GuestsListQuery>) => void
  reset: () => void
}

function GuestsListContent({ query, setQuery, reset }: ContentProps) {
  const { data, isLoading, error } = useGuestsList(query)
  const goToPage = (page: number) => setQuery({ page })

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">게스트</h2>
        {data && (
          <p className="text-sm text-muted-foreground">
            총 {data.totalElements}건
          </p>
        )}
      </div>
      <GuestsFilterForm query={query} onChange={setQuery} onReset={reset} />
      {error instanceof ApiError && error.status === 403 && (
        <p className="text-destructive text-sm mb-2">
          이 화면을 볼 권한이 없습니다
        </p>
      )}
      <GuestsTable
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
