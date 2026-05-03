import { useNavigate } from "react-router-dom"
import { ChangePasswordForm } from "@/features/change-password/ui/change-password-form"

export function ChangePasswordPage() {
  const navigate = useNavigate()
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm">
        <h1 className="text-center text-xl font-bold">비밀번호 변경</h1>
        <p className="text-sm text-muted-foreground">최초 로그인 후 비밀번호를 변경해야 합니다.</p>
        <ChangePasswordForm onSuccess={() => navigate("/", { replace: true })} />
      </div>
    </main>
  )
}
