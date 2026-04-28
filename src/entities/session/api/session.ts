import { http } from "../../../shared/api/http"
import type {
  AdminLoginResponseRaw,
  ChangePasswordCommand,
  LoginCommand,
  SessionMeta,
} from "../model/types"

interface ApiCommonResponse<T> {
  data: T
}

function toSessionMeta(raw: AdminLoginResponseRaw): SessionMeta {
  const issued = new Date(raw.issuedAt)
  const expires = new Date(issued.getTime() + raw.expiresIn * 1000)
  return {
    role: raw.role,
    mustChangePassword: raw.mustChangePassword,
    issuedAt: issued.toISOString(),
    expiresAt: expires.toISOString(),
  }
}

export async function login(cmd: LoginCommand): Promise<SessionMeta> {
  const res = await http<ApiCommonResponse<AdminLoginResponseRaw>>(
    "/api/v1/auth/admin/login",
    { method: "POST", body: cmd, skip401Redirect: true },
  )
  return toSessionMeta(res.data)
}

export async function logout(): Promise<void> {
  await http<void>("/api/v1/auth/admin/logout", { method: "POST" })
}

export async function changePassword(cmd: ChangePasswordCommand): Promise<void> {
  await http<void>("/api/v1/admin/password/change", { method: "POST", body: cmd })
}
