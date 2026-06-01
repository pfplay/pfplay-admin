import { useState } from "react"
import {
  partyroomsListQuerySchema,
  type PartyroomsListQuery,
} from "@/features/partyrooms/model/filter-schema"
import { usePartyroomsList } from "@/features/partyrooms/api/use-partyrooms-list"
import { PartyroomsFilterForm } from "@/features/partyrooms/ui/partyrooms-filter-form"
import { PartyroomsTable } from "@/features/partyrooms/ui/partyrooms-table"
import { BulkActionToolbar } from "@/features/partyrooms/ui/bulk-action-toolbar"
import { BulkActionDialog } from "@/features/partyrooms/ui/mutation-dialogs/bulk-action-dialog"
import { BulkActionResultDialog } from "@/features/partyrooms/ui/mutation-dialogs/bulk-action-result-dialog"
import { VirtualDjBulkDialog } from "@/features/partyrooms/ui/mutation-dialogs/virtual-dj-bulk-dialog"
import type { BulkActionResult } from "@/features/partyrooms/model/bulk-schema"
import { useUrlQueryState } from "@/shared/lib/use-url-query-state"
import { useSelectionState } from "@/shared/lib/use-selection-state"
import { Pagination } from "@/widgets/pagination"
import { ApiError } from "@/shared/api/error"

export function PartyroomsListWidget() {
  const { query, setQuery, reset } = useUrlQueryState(partyroomsListQuerySchema)

  if (query === null) return null
  return (
    <PartyroomsListContent query={query} setQuery={setQuery} reset={reset} />
  )
}

interface ContentProps {
  query: PartyroomsListQuery
  setQuery: (next: Partial<PartyroomsListQuery>) => void
  reset: () => void
}

function PartyroomsListContent({ query, setQuery, reset }: ContentProps) {
  const { data, isLoading, error } = usePartyroomsList(query)

  // query 변경 시 selection reset (filter / sort / page / size 모두) — spec §5.2 α
  const { selectedIds, toggleId, toggleAll, clearSelection } = useSelectionState<number>([
    query.page,
    query.size,
    query.sort,
    query.status,
    query.stageType,
    query.host,
    query.createdFrom,
    query.createdTo,
  ])
  const [bulkOpen, setBulkOpen] = useState(false)
  const [vdjOpen, setVdjOpen] = useState(false)
  const [bulkResults, setBulkResults] = useState<{
    results: BulkActionResult[]
    attempted: number
  } | null>(null)

  const onToggleAll = (checked: boolean) =>
    toggleAll(checked, (data?.content ?? []).map((r) => r.partyroomId))

  const goToPage = (page: number) => setQuery({ page })

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">파티룸</h2>
        {data && (
          <p className="text-sm text-muted-foreground">
            총 {data.totalElements}건
          </p>
        )}
      </div>
      <PartyroomsFilterForm
        query={query}
        onChange={setQuery}
        onReset={reset}
      />
      {error instanceof ApiError && error.status === 403 && (
        <p className="text-destructive text-sm mb-2">
          이 화면을 볼 권한이 없습니다
        </p>
      )}
      {error instanceof ApiError && error.status === 400 && (
        <p className="text-destructive text-sm mb-2">{error.message}</p>
      )}
      <BulkActionToolbar
        selectionSize={selectedIds.size}
        onClearSelection={clearSelection}
        onOpenDialog={() => setBulkOpen(true)}
        onOpenVirtualDj={() => setVdjOpen(true)}
      />
      <VirtualDjBulkDialog
        selectedIds={Array.from(selectedIds)}
        open={vdjOpen}
        onOpenChange={setVdjOpen}
        onSuccess={clearSelection}
      />
      <BulkActionDialog
        selectedIds={Array.from(selectedIds)}
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onResults={(results) => {
          // spec §4.3 — selection clear 즉시 (성공/실패 모두)
          const attempted = selectedIds.size
          clearSelection()
          // 실패 있으면 결과 dialog open
          if (results.some((r) => !r.success)) {
            setBulkResults({ results, attempted })
          }
        }}
      />
      <BulkActionResultDialog
        results={bulkResults?.results ?? []}
        attemptedCount={bulkResults?.attempted ?? 0}
        open={bulkResults !== null}
        onOpenChange={(o) => {
          if (!o) setBulkResults(null)
        }}
      />
      <PartyroomsTable
        rows={data?.content ?? []}
        isLoading={isLoading}
        isEmpty={!isLoading && (data?.empty ?? false)}
        selectedIds={selectedIds}
        onToggleId={toggleId}
        onToggleAll={onToggleAll}
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
