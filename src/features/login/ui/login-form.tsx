import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { ApiError } from "@/shared/api/error"
import { useLogin } from "../api/use-login"
import { loginSchema, type LoginFormValues } from "../model/schema"

interface Props {
  onSuccess: (meta: { mustChangePassword: boolean }) => void
}

export function LoginForm({ onSuccess }: Props) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const login = useLogin((meta) => onSuccess(meta))

  const submit = handleSubmit((values) => {
    login.mutate(values, {
      onError: (err) => {
        if (err instanceof ApiError && err.status === 401) {
          setError("root", { message: "이메일 또는 비밀번호가 올바르지 않습니다" })
        } else if (err instanceof ApiError && err.status === 429) {
          setError("root", { message: "잠시 후 다시 시도해주세요" })
        } else {
          toast.error("서버 오류")
          setError("root", { message: "잠시 후 다시 시도해주세요" })
        }
      },
    })
  })

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">이메일</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          className="mt-1 w-full rounded border px-3 py-2"
        />
        {errors.email && <p role="alert" className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">비밀번호</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
          className="mt-1 w-full rounded border px-3 py-2"
        />
        {errors.password && <p role="alert" className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
      </div>
      {errors.root && <p role="alert" className="text-sm text-destructive">{errors.root.message}</p>}
      <button
        type="submit"
        disabled={isSubmitting || login.isPending}
        className="w-full rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
      >
        로그인
      </button>
    </form>
  )
}
