import {
  reportsListQuerySchema,
  type ReportsListQuery,
} from "@/features/reports/model/filter-schema"
import { useReportsList } from "@/features/reports/api/use-reports-list"
import { ReportsFilterForm } from "@/features/reports/ui/reports-filter-form"
import { ReportsTable } from "@/features/reports/ui/reports-table"
import { useUrlMultiParamState } from "@/shared/lib/use-url-multi-param-state"
import { Pagination } from "@/widgets/pagination"
import { ApiError } from "@/shared/api/error"

const REPORTS_MULTI_KEYS = ["status", "category"] as const

export function ReportsListWidget() {
  const { query, setQuery, reset } = useUrlMultiParamState(
    reportsListQuerySchema,
    REPORTS_MULTI_KEYS,
  )

  if (query === null) return null
  return <ReportsListContent query={query} setQuery={setQuery} reset={reset} />
}

interface ContentProps {
  query: ReportsListQuery
  setQuery: (next: Partial<ReportsListQuery>) => void
  reset: () => void
}

function ReportsListContent({ query, setQuery, reset }: ContentProps) {
  const { data, isLoading, error } = useReportsList(query)
  const goToPage = (page: number) => setQuery({ page })

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">신고</h2>
        {data && (
          <p className="text-sm text-muted-foreground">
            총 {data.totalElements}건
          </p>
        )}
      </div>
      <ReportsFilterForm query={query} onChange={setQuery} onReset={reset} />
      {error instanceof ApiError && error.status === 403 && (
        <p className="text-destructive text-sm mb-2">
          이 화면을 볼 권한이 없습니다
        </p>
      )}
      {error instanceof ApiError && error.status === 400 && (
        <p className="text-destructive text-sm mb-2">{error.message}</p>
      )}
      <ReportsTable
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
