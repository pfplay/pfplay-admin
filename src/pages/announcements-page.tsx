import { Megaphone } from "lucide-react"

// G12 placeholder. 실제 list/form은 backend (REST POST 생성 + WebSocket broadcast) ship
// 후 별도 PR로 채움. 본 페이지는 사이드바 nav 진입점만 잡고 후속 backend ask 안내.
export function AnnouncementsPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-4">
        <Megaphone className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">시스템 공지</h1>
      </div>
      <div className="rounded-lg border border-dashed border-border p-8 text-center bg-card">
        <p className="text-sm text-muted-foreground mb-2">
          서비스 점검 예고 등 시스템 전체 공지를 관리합니다.
        </p>
        <p className="text-xs text-muted-foreground">
          기능 준비 중 — backend REST 생성 endpoint + WebSocket 전파 ship 후 활성화 예정.
        </p>
      </div>
    </div>
  )
}
