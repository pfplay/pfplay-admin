import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  administratorListQuerySchema,
  type AdministratorListQuery,
} from "@/features/administrators/model/filter-schema"
import { useAdministratorsList } from "@/features/administrators/api/use-administrators-list"
import { AdministratorsFilterForm } from "@/features/administrators/ui/administrators-filter-form"
import { AdministratorsTable } from "@/features/administrators/ui/administrators-table"
import { CreateAdministratorDialog } from "@/features/administrators/ui/mutation-dialogs/create-administrator-dialog"
import { useUrlQueryState } from "@/shared/lib/use-url-query-state"
import { ApiError } from "@/shared/api/error"

export function AdministratorsListWidget() {
  const { query, setQuery, reset } = useUrlQueryState(
    administratorListQuerySchema,
  )
  if (query === null) return null
  return <AdministratorsListContent query={query} setQuery={setQuery} reset={reset} />
}

interface ContentProps {
  query: AdministratorListQuery
  setQuery: (next: Partial<AdministratorListQuery>) => void
  reset: () => void
}

function AdministratorsListContent({ query, setQuery, reset }: ContentProps) {
  const { data, isLoading, error } = useAdministratorsList(query)
  const [createOpen, setCreateOpen] = useState(false)
  const items = data?.items ?? []
  const isEmpty = !isLoading && items.length === 0

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">어드민 관리</h2>
        <div className="flex items-center gap-3">
          {data && (
            <p className="text-sm text-muted-foreground">총 {data.totalCount}명</p>
          )}
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            신규 어드민
          </Button>
        </div>
      </div>
      <AdministratorsFilterForm query={query} onChange={setQuery} onReset={reset} />
      {error instanceof ApiError && error.status === 403 && (
        <p className="text-destructive text-sm mb-2">
          이 화면을 볼 권한이 없습니다 (SUPER_ADMIN 전용)
        </p>
      )}
      <AdministratorsTable rows={items} isLoading={isLoading} isEmpty={isEmpty} />
      <CreateAdministratorDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
