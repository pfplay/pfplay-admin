import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import {
  partyroomsListQuerySchema,
  type PartyroomsListQuery,
} from "@/features/partyrooms/model/filter-schema"
import { usePartyroomsList } from "@/features/partyrooms/api/use-partyrooms-list"
import { PartyroomsFilterForm } from "@/features/partyrooms/ui/partyrooms-filter-form"
import { PartyroomsTable } from "@/features/partyrooms/ui/partyrooms-table"
import { BulkActionToolbar } from "@/features/partyrooms/ui/bulk-action-toolbar"
import { BulkActionDialog } from "@/features/partyrooms/ui/mutation-dialogs/bulk-action-dialog"
import {
  parseSearchParams,
  stripInvalidParams,
  serializeQuery,
} from "@/shared/lib/url-state"
import { Pagination } from "@/widgets/pagination"
import { ApiError } from "@/shared/api/error"

export function PartyroomsListWidget() {
  const [params, setParams] = useSearchParams()
  const parsed = parseSearchParams(partyroomsListQuerySchema, params)

  // invalid query → drop invalid params + toast (effect — render 중 setParams 금지, G3 패턴)
  useEffect(() => {
    if (!parsed.success) {
      const cleaned = stripInvalidParams(params, parsed.error)
      setParams(cleaned, { replace: true })
      toast.error("필터 일부가 잘못돼 무시했어요")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed.success])

  if (!parsed.success) return null

  const query: PartyroomsListQuery = parsed.data
  return <PartyroomsListContent query={query} setParams={setParams} />
}

interface ContentProps {
  query: PartyroomsListQuery
  setParams: ReturnType<typeof useSearchParams>[1]
}

function PartyroomsListContent({ query, setParams }: ContentProps) {
  const { data, isLoading, error } = usePartyroomsList(query)

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)
  // bulkResults state는 G6 (BulkActionResultDialog) 진입 시점에 추가

  // query 변경 시 selection reset (filter / sort / page / size 모두) — spec §5.2 α
  useEffect(() => {
    setSelectedIds(new Set())
  }, [
    query.page,
    query.size,
    query.sort,
    query.status,
    query.stageType,
    query.host,
    query.createdFrom,
    query.createdTo,
  ])

  const onToggleId = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const onToggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set((data?.content ?? []).map((r) => r.partyroomId)))
    } else {
      setSelectedIds(new Set())
    }
  }
  const onClearSelection = () => setSelectedIds(new Set())

  const updateQuery = (next: Partial<PartyroomsListQuery>) => {
    const merged = { ...query, ...next }
    setParams(serializeQuery(merged as Record<string, unknown>))
  }
  const reset = () => setParams(new URLSearchParams())
  const goToPage = (page: number) => updateQuery({ page })

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
        onChange={updateQuery}
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
        onClearSelection={onClearSelection}
        onOpenDialog={() => setBulkOpen(true)}
      />
      <BulkActionDialog
        selectedIds={Array.from(selectedIds)}
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onResults={() => {
          // spec §4.3 — selection clear 즉시 (성공/실패 모두). 결과 dialog open 분기는 G6에서 추가.
          setSelectedIds(new Set())
        }}
      />
      <PartyroomsTable
        rows={data?.content ?? []}
        isLoading={isLoading}
        isEmpty={!isLoading && (data?.empty ?? false)}
        selectedIds={selectedIds}
        onToggleId={onToggleId}
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
