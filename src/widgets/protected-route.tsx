import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useSessionStore } from "@/entities/session"

interface Props { children: ReactNode }

export function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, meta } = useSessionStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ returnTo: location.pathname + location.search }} replace />
  }
  if (meta?.mustChangePassword && location.pathname !== "/password/change") {
    return <Navigate to="/password/change" replace />
  }
  return <>{children}</>
}
