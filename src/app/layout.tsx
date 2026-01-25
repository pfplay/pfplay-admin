import { NavLink, Outlet } from "react-router-dom"
import { Users, DoorOpen, PlaySquare } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import "@/globals.css"

export default function AppLayout() {
  const navItems = [
    { to: "/", icon: Users, label: "가상 유저", disabled: true },
    { to: "/rooms", icon: DoorOpen, label: "파티룸", disabled: true },
    { to: "/scenarios", icon: PlaySquare, label: "시나리오", disabled: false },
  ]

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 border-r border-border bg-card">
        <div className="flex h-16 items-center border-b border-border px-6">
          <h1 className="text-xl font-bold text-foreground">PFPlay Admin</h1>
        </div>
        <nav className="space-y-1 p-4">
          {navItems.map((item) =>
            item.disabled ? (
              <div
                key={item.to}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            )
          )}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
