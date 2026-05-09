/**
 * Backend mirror — `pfplay-platform/administration` F-1 거버넌스 도메인.
 *
 * - `AdminRole` enum: backend `domain/value/AdminRole`
 * - `AdministratorView`: backend `payload/response/AdministratorView` 1:1
 * - `AdministratorListResponse`: backend `payload/response/AdministratorListResponse`
 * - `CreateAdministratorResponse`: 임시 비밀번호(tempPassword) 한 번만 노출
 * - `ResetPasswordResponse`: 비밀번호 리셋 시 임시 비번 발급
 *
 * 모든 `/api/v1/admin/system/administrators/**` endpoint는 SUPER_ADMIN 전용
 * (`SecurityConfig.java` line 96 `requestMatchers("/api/v1/admin/system/**").hasRole("SUPER_ADMIN")`).
 */

export type AdminRole = "SUPER_ADMIN" | "ADMIN"

export interface AdministratorView {
  administratorId: number
  role: AdminRole
  /** LocalDateTime ISO (KST 가정 — 14b §11 footer 일관) */
  grantedAt: string
  grantedByAdministratorId: number | null
  /** null이면 활성, 값이 있으면 회수됨 */
  revokedAt: string | null
  userAccountId: number
  email: string
  lastLoginAt: string | null
  mustChangePassword: boolean
  /** 멤버 프로필 부재 시 null */
  memberId: number | null
  nickname: string | null
}

export interface AdministratorListResponse {
  totalCount: number
  items: AdministratorView[]
}

export interface CreateAdministratorResponse {
  administratorId: number
  userAccountId: number
  /** includeMemberProfile=false일 때 null */
  memberId: number | null
  /** 임시 비밀번호 — 응답 후 재조회 불가, 어드민이 받아 직접 사용자에게 전달 */
  tempPassword: string
  message: string
}

export interface ResetPasswordResponse {
  tempPassword: string
  message: string
}
