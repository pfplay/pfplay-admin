export type AdminRole = "SUPER_ADMIN" | "ADMIN"

export interface SessionMeta {
  role: AdminRole
  mustChangePassword: boolean
  issuedAt: string  // ISO
  expiresAt: string // ISO (issuedAt + expiresIn 초)
}

export interface LoginCommand {
  email: string
  password: string
}

export interface AdminLoginResponseRaw {
  tokenType: "Cookie"
  expiresIn: number          // 초
  issuedAt: string           // 백엔드 LocalDateTime — ISO 문자열로 직렬화 가정
  role: AdminRole
  mustChangePassword: boolean
}

export interface ChangePasswordCommand {
  currentPassword: string
  newPassword: string
}
