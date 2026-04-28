import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { useSessionStore } from "@/entities/session"
import { LoginForm } from "@/features/login/ui/login-form"

interface LocationState {
  returnTo?: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, meta } = useSessionStore()
  const returnTo = (location.state as LocationState | null)?.returnTo

  if (isAuthenticated && !meta?.mustChangePassword) {
    return <Navigate to={returnTo ?? "/"} replace />
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm">
        <h1 className="text-center text-2xl font-bold">PFPlay Admin 로그인</h1>
        <LoginForm
          onSuccess={(meta) => {
            const next = meta.mustChangePassword ? "/password/change" : (returnTo ?? "/")
            navigate(next, { replace: true })
          }}
        />
      </div>
    </main>
  )
}
