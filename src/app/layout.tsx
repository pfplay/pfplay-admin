import { NavLink, Outlet } from "react-router-dom"
import {
  Users,
  DoorOpen,
  LogOut,
  LayoutDashboard,
  Flag,
  Image,
  Megaphone,
} from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { useSessionStore } from "@/entities/session"
import type { AdminRole } from "@/entities/session"
import { useLogout } from "@/features/logout/api/use-logout"
import "@/globals.css"

interface NavItem {
  to: string
  icon: typeof Users
  label: string
  /** 부재 시 모든 role에 노출. 지정되면 정확히 일치하는 role만 노출 (14f R6). */
  role?: AdminRole
}

export default function AppLayout() {
  const { meta } = useSessionStore()
  const logout = useLogout()

  const navItems: NavItem[] = [
    { to: "/", icon: LayoutDashboard, label: "대시보드" },
    { to: "/members", icon: Users, label: "회원" },
    { to: "/partyrooms", icon: DoorOpen, label: "파티룸" },
    { to: "/reports", icon: Flag, label: "신고" },
    {
      to: "/announcements",
      icon: Megaphone,
      label: "공지",
      role: "SUPER_ADMIN",
    },
    { to: "/avatars/bodies", icon: Image, label: "아바타", role: "SUPER_ADMIN" },
  ]
  const visibleNavItems = navItems.filter(
    (item) => !item.role || meta?.role === item.role,
  )

  return (
    <div className="flex h-screen bg-background">
      <aside className="flex w-64 flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center border-b border-border px-6">
          <h1 className="text-xl font-bold text-foreground">PFPlay Admin</h1>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {visibleNavItems.map((item) => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )} end={item.to === "/"}>
              <item.icon className="h-5 w-5" />{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-4 space-y-2">
          {meta && (
            <p className="text-xs text-muted-foreground">권한: {meta.role}</p>
          )}
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
