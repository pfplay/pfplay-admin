import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { ApiError } from "@/shared/api/error"
import { useChangePassword } from "../api/use-change-password"
import { changePasswordSchema, type ChangePasswordFormValues } from "../model/schema"

interface Props {
  onSuccess: () => void
}

export function ChangePasswordForm({ onSuccess }: Props) {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } =
    useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema) })

  const change = useChangePassword(() => {
    toast.success("비밀번호가 변경되었습니다")
    onSuccess()
  })

  const submit = handleSubmit((values) => {
    change.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onError: (err) => {
          if (err instanceof ApiError && err.errorCode === "ADMIN-INVALID-CURRENT-PASSWORD") {
            setError("currentPassword", { message: "현재 비밀번호가 올바르지 않습니다" })
          } else if (err instanceof ApiError && err.errorCode === "ADMIN-INVALID-NEW-PASSWORD") {
            setError("newPassword", { message: "비밀번호 정책을 만족하지 않습니다" })
          } else if (err instanceof ApiError && err.status === 400) {
            setError("root", { message: err.message })
          } else {
            toast.error("서버 오류")
            setError("root", { message: "잠시 후 다시 시도해주세요" })
          }
        },
      },
    )
  })

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium">현재 비밀번호</label>
        <input id="currentPassword" type="password" autoComplete="current-password"
          {...register("currentPassword")} className="mt-1 w-full rounded border px-3 py-2" />
        {errors.currentPassword && <p role="alert" className="mt-1 text-sm text-destructive">{errors.currentPassword.message}</p>}
      </div>
      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium">새 비밀번호</label>
        <input id="newPassword" type="password" autoComplete="new-password"
          {...register("newPassword")} className="mt-1 w-full rounded border px-3 py-2" />
        {errors.newPassword && <p role="alert" className="mt-1 text-sm text-destructive">{errors.newPassword.message}</p>}
      </div>
      <div>
        <label htmlFor="newPasswordConfirm" className="block text-sm font-medium">새 비밀번호 확인</label>
        <input id="newPasswordConfirm" type="password" autoComplete="new-password"
          {...register("newPasswordConfirm")} className="mt-1 w-full rounded border px-3 py-2" />
        {errors.newPasswordConfirm && <p role="alert" className="mt-1 text-sm text-destructive">{errors.newPasswordConfirm.message}</p>}
      </div>
      {errors.root && <p role="alert" className="text-sm text-destructive">{errors.root.message}</p>}
      <button type="submit" disabled={isSubmitting || change.isPending}
        className="w-full rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">
        변경
      </button>
    </form>
  )
}
