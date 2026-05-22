import type {
  ProviderType,
  UserAccountSummary,
  RecentActivityLogItem,
} from "@/entities/member/model/types"

export interface AdminGuestSummary {
  guestId: number
  userAccountId: number
  email: string
  providerType: ProviderType
  nickname: string | null
  agent: string | null
  isProfileUpdated: boolean
  lastLoginAt: string | null // LocalDateTime ISO string
  createdAt: string
  withdrawn: boolean
  withdrawnAt: string | null
}

export interface GuestProfileSummary {
  nickname: string | null
  introduction: string | null
}

export interface AdminGuestDetail {
  guestId: number
  userAccount: UserAccountSummary
  profile: GuestProfileSummary
  agent: string | null
  isProfileUpdated: boolean
  createdAt: string
  withdrawn: boolean
  withdrawnAt: string | null
  recentActivityLog: RecentActivityLogItem[]
}
