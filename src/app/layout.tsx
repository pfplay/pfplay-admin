import { useState } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import {
  Users,
  DoorOpen,
  LogOut,
  LayoutDashboard,
  Flag,
  Image,
  Megaphone,
  MessageSquareWarning,
  ShieldCheck,
  Bot,
  Drama,
  MessageSquare,
  ListMusic,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { useSessionStore } from "@/entities/session"
import type { AdminRole } from "@/entities/session"
import { useLogout } from "@/features/logout/api/use-logout"
import "@/globals.css"

interface NavChild {
  to: string
  label: string
  icon: typeof Users
}

interface NavItem {
  to: string
  icon: typeof Users
  label: string
  /** 부재 시 모든 role에 노출. 지정되면 정확히 일치하는 role만 노출 (14f R6). */
  role?: AdminRole
  /** 있으면 접이식 그룹. 부모 클릭 → to(허브)로 이동, 셰브론 → 하위 펼침. */
  children?: NavChild[]
}

interface NavSection {
  /** 부재 시 헤더 미노출 (대시보드 같은 단독 항목용). 지정 시 섹션 라벨로 표시. */
  label?: string
  items: NavItem[]
}

// 운영(daily ops)과 시스템(SUPER_ADMIN governance) 분리. 권한 라인과 그룹 라인 일치.
const navSections: NavSection[] = [
  {
    items: [{ to: "/", icon: LayoutDashboard, label: "대시보드" }],
  },
  {
    label: "운영 관리",
    items: [
      { to: "/members", icon: Users, label: "회원" },
      { to: "/partyrooms", icon: DoorOpen, label: "파티룸" },
      { to: "/reports", icon: Flag, label: "신고" },
      { to: "/voc/bug-reports", icon: MessageSquareWarning, label: "사용자 피드백" },
      // 클릭 → 허브(가이드), 펼침 → 상세. 셋업 순서(봇 풀→송팩→…→배치)대로 나열.
      {
        to: "/virtual-crew",
        icon: Bot,
        label: "가상 크루",
        children: [
          { to: "/virtual-crew/pool", icon: Bot, label: "봇 풀" },
          { to: "/virtual-crew/song-packs", icon: ListMusic, label: "송팩" },
          { to: "/virtual-crew/personas", icon: Drama, label: "페르소나" },
          { to: "/virtual-crew/chat-config", icon: MessageSquare, label: "채팅 설정" },
          { to: "/virtual-crew/rooms", icon: SlidersHorizontal, label: "크루 배치" },
        ],
      },
    ],
  },
  {
    label: "시스템 관리",
    items: [
      { to: "/administrators", icon: ShieldCheck, label: "어드민 관리", role: "SUPER_ADMIN" },
      { to: "/announcements", icon: Megaphone, label: "공지", role: "SUPER_ADMIN" },
      { to: "/avatars/bodies", icon: Image, label: "아바타", role: "SUPER_ADMIN" },
    ],
  },
]

const linkClass = (isActive: boolean, indent = false) =>
  cn(
    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
    indent && "py-2 pl-11 text-[13px]",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
  )

function NavGroup({ item }: { item: NavItem }) {
  const location = useLocation()
  const groupActive = location.pathname.startsWith(item.to)
  const [open, setOpen] = useState(groupActive)

  return (
    <div>
      <div
        className={cn(
          "flex items-center rounded-lg pr-2 transition-colors",
          groupActive ? "text-foreground" : "text-muted-foreground hover:bg-accent",
        )}
      >
        {/* 부모 클릭 → 허브로 이동 */}
        <NavLink
          to={item.to}
          end
          className={({ isActive }) =>
            cn(
              "flex flex-1 items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium",
              isActive ? "bg-primary text-primary-foreground" : "hover:text-accent-foreground",
            )
          }
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </NavLink>
        {/* 셰브론 → 하위 펼침/접힘 */}
        <button
          type="button"
          aria-label={open ? `${item.label} 접기` : `${item.label} 펼치기`}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 rounded p-1 hover:bg-accent-foreground/10"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", open ? "" : "-rotate-90")} />
        </button>
      </div>
      {open && (
        <div className="mt-1 space-y-1">
          {item.children!.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              className={({ isActive }) => linkClass(isActive, true)}
            >
              <child.icon className="h-4 w-4" />
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AppLayout() {
  const { meta } = useSessionStore()
  const logout = useLogout()

  // role 필터링 후 빈 섹션은 제거 (ADMIN 시 "시스템 관리" 헤더 자체 미노출).
  const visibleSections = navSections
    .map((s) => ({
      ...s,
      items: s.items.filter((item) => !item.role || meta?.role === item.role),
    }))
    .filter((s) => s.items.length > 0)

  return (
    <div className="flex h-screen bg-background">
      <aside className="flex w-64 flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center border-b border-border px-6">
          <h1 className="text-xl font-bold text-foreground">PFPlay Admin</h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {visibleSections.map((section, i) => (
            <div key={i} className="space-y-1">
              {section.label && (
                <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </p>
              )}
              {section.items.map((item) =>
                item.children ? (
                  <NavGroup key={item.to} item={item} />
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => linkClass(isActive)}
                    end={item.to === "/"}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </NavLink>
                ),
              )}
            </div>
          ))}
        </nav>
        <div className="border-t border-border p-4 space-y-2">
          {meta && <p className="text-xs text-muted-foreground">권한: {meta.role}</p>}
          <button
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />로그아웃
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
