import { Link } from "react-router-dom"
import { Megaphone, History } from "lucide-react"
import { AnnouncementLaunchForm } from "@/features/announcements/ui/announcement-launch-form"

export function AnnouncementsPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Megaphone className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold">공지 송출</h1>
        </div>
        <Link
          to="/announcements/history"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <History className="h-4 w-4" />
          송출 이력
        </Link>
      </div>
      <AnnouncementLaunchForm />
    </div>
  )
}
