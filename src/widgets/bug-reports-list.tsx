import { bugReportsListQuerySchema, type BugReportsListQuery } from "@/features/bug-reports/model/filter-schema"
import { useBugReportsList } from "@/features/bug-reports/api/use-bug-reports-list"
import { BugReportsTable } from "@/features/bug-reports/ui/bug-reports-table"
import { BugReportsFilterForm } from "@/features/bug-reports/ui/bug-reports-filter-form"
import { useUrlQueryState } from "@/shared/lib/use-url-query-state"
import { Pagination } from "@/widgets/pagination"
import { ApiError } from "@/shared/api/error"

export function BugReportsListWidget() {
  const { query, setQuery, reset } = useUrlQueryState(bugReportsListQuerySchema)
  if (query === null) return null
  return <BugReportsListContent query={query} setQuery={setQuery} reset={reset} />
}

interface ContentProps {
  query: BugReportsListQuery
  setQuery: (next: Partial<BugReportsListQuery>) => void
  reset: () => void
}

function BugReportsListContent({ query, setQuery, reset }: ContentProps) {
  const { data, isLoading, error } = useBugReportsList(query)
  const goToPage = (page: number) => setQuery({ page })

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">사용자 피드백</h2>
        {data && (
          <p className="text-sm text-muted-foreground">
            총 {data.totalElements}건
          </p>
        )}
      </div>
      <BugReportsFilterForm query={query} onChange={setQuery} onReset={reset} />
      {error instanceof ApiError && error.status === 403 && (
        <p className="text-destructive text-sm mb-2">
          이 화면을 볼 권한이 없습니다
        </p>
      )}
      <BugReportsTable
        rows={data?.items ?? []}
        isLoading={isLoading}
        isEmpty={!isLoading && (data?.items.length === 0)}
      />
      {data && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          onChange={goToPage}
        />
      )}
    </div>
  )
}
