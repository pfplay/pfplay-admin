import { Link } from "react-router-dom"
import { History, Megaphone } from "lucide-react"

// G21 placeholder. 실제 테이블 + 취소 버튼은 G22 chunk 에서 채움 (list query +
// cancel mutation + ANN-001/002 처리). 지금은 발사 form 의 redirect target 만 reserve.
export function AnnouncementsHistoryPage() {
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
      <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          발사 이력 테이블은 후속 chunk 에서 채워집니다.
        </p>
      </div>
    </div>
  )
}
