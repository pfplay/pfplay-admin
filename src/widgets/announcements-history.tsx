import { useState } from "react"
import { Link } from "react-router-dom"
import { History, Megaphone } from "lucide-react"
import { useUrlQueryState } from "@/shared/lib/use-url-query-state"
import {
  announcementListQuerySchema,
  type AnnouncementListQuery,
} from "@/features/announcements/model/filter-schema"
import { useAnnouncementsList } from "@/features/announcements/api/use-announcements-list"
import { AnnouncementsTable } from "@/features/announcements/ui/announcements-table"
import { CancelAnnouncementDialog } from "@/features/announcements/ui/cancel-announcement-dialog"
import { Pagination } from "@/widgets/pagination"
import type { Announcement } from "@/entities/announcement"

export function AnnouncementsHistoryWidget() {
  const { query, setQuery } = useUrlQueryState(announcementListQuerySchema)
  if (query === null) return null
  return <AnnouncementsHistoryContent query={query} setQuery={setQuery} />
}

interface ContentProps {
  query: AnnouncementListQuery
  setQuery: (next: Partial<AnnouncementListQuery>) => void
}

function AnnouncementsHistoryContent({ query, setQuery }: ContentProps) {
  const { data, isLoading } = useAnnouncementsList(query)
  const [cancelTarget, setCancelTarget] = useState<Announcement | null>(null)

  const items = data?.content ?? []
  const isEmpty = !isLoading && items.length === 0
  // 페이지 노출은 backend 의 응답 페이지 인덱스 사용 (URL 미존재 시 backend default 0 반영).
  const currentPage = data?.number ?? query.page ?? 0

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <History className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold">공지 이력</h1>
        </div>
        <Link
          to="/announcements"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Megaphone className="h-4 w-4" />
          공지 발사
        </Link>
      </div>
      <AnnouncementsTable
        rows={items}
        isLoading={isLoading}
        isEmpty={isEmpty}
        onCancelClick={setCancelTarget}
      />
      {data && (
        <Pagination
          page={currentPage}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          onChange={(p) => setQuery({ page: p })}
        />
      )}
      <CancelAnnouncementDialog
        target={cancelTarget}
        onOpenChange={(o) => {
          if (!o) setCancelTarget(null)
        }}
      />
    </div>
  )
}
