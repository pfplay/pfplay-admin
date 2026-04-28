export type ProviderType = "GOOGLE" | "TWITTER" | "LOCAL"
export type AuthorityTier = "FM" | "AM" | "GT"
// FM = FULL_MEMBER (가입 + wallet 등록), AM = ASSOCIATE_MEMBER (가입 default),
// GT = GUEST (별 테이블이 정상 경로 — member 테이블에는 admin 강등 edge case에만 등장)

export interface AdminMemberSummary {
  memberId: number
  userAccountId: number
  email: string
  providerType: ProviderType
  nickname: string | null
  authorityTier: AuthorityTier
  lastLoginAt: string | null // LocalDateTime ISO string
  createdAt: string
  withdrawn: boolean
  withdrawnAt: string | null
}

export interface UserAccountSummary {
  userAccountId: number
  email: string
  providerType: ProviderType
  createdAt: string
}

export interface MemberProfileSummary {
  nickname: string | null
  introduction: string | null
}

export interface RecentActivityLogItem {
  occurredAt: string
  type: string
  summary: string
}

export interface AdminMemberDetail {
  memberId: number
  userAccount: UserAccountSummary
  profile: MemberProfileSummary
  authorityTier: AuthorityTier
  createdAt: string
  recentActivityLog: RecentActivityLogItem[]
}
