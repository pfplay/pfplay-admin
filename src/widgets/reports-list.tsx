import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import {
  reportsListQuerySchema,
  type ReportsListQuery,
} from "@/features/reports/model/filter-schema"
import { useReportsList } from "@/features/reports/api/use-reports-list"
import { ReportsFilterForm } from "@/features/reports/ui/reports-filter-form"
import { ReportsTable } from "@/features/reports/ui/reports-table"
import { Pagination } from "@/widgets/pagination"
import { ApiError } from "@/shared/api/error"

/**
 * URL ↔ ReportsListQuery 변환. multi status[]/category[]는 `URLSearchParams.getAll`/`append`로 처리.
 */
function urlToQueryObj(params: URLSearchParams): Record<string, unknown> {
  const obj: Record<string, unknown> = {}
  const status = params.getAll("status")
  if (status.length > 0) obj.status = status
  const category = params.getAll("category")
  if (category.length > 0) obj.category = category
  for (const key of ["createdFrom", "createdTo", "page", "size", "sort"]) {
    const v = params.get(key)
    if (v !== null && v !== "") obj[key] = v
  }
  return obj
}

function queryToUrl(query: ReportsListQuery): URLSearchParams {
  const out = new URLSearchParams()
  if (query.status) query.status.forEach((s) => out.append("status", s))
  if (query.category) query.category.forEach((c) => out.append("category", c))
  if (query.createdFrom) out.set("createdFrom", query.createdFrom)
  if (query.createdTo) out.set("createdTo", query.createdTo)
  if (query.page > 0) out.set("page", String(query.page))
  if (query.size !== 50) out.set("size", String(query.size))
  if (query.sort !== "created_at_desc") out.set("sort", query.sort)
  return out
}

export function ReportsListWidget() {
  const [params, setParams] = useSearchParams()
  const obj = urlToQueryObj(params)
  const parsed = reportsListQuerySchema.safeParse(obj)

  useEffect(() => {
    if (!parsed.success) {
      // invalid params 모두 drop (multi 항목은 schema에서 array로 정상 — invalid 시 일괄 reset)
      setParams(new URLSearchParams(), { replace: true })
      toast.error("필터 일부가 잘못돼 무시했어요")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed.success])

  if (!parsed.success) return null

  const query: ReportsListQuery = parsed.data
  return <ReportsListContent query={query} setParams={setParams} />
}

interface ContentProps {
  query: ReportsListQuery
  setParams: ReturnType<typeof useSearchParams>[1]
}

function ReportsListContent({ query, setParams }: ContentProps) {
  const { data, isLoading, error } = useReportsList(query)

  const updateQuery = (next: Partial<ReportsListQuery>) => {
    const merged = { ...query, ...next }
    setParams(queryToUrl(merged))
  }
  const reset = () => setParams(new URLSearchParams())
  const goToPage = (page: number) => updateQuery({ page })

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
      <ReportsFilterForm query={query} onChange={updateQuery} onReset={reset} />
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
