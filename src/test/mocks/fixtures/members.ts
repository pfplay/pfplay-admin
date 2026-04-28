import type { AdminMemberSummary, AdminMemberDetail } from "@/entities/member"

export const memberSummaryFixture: AdminMemberSummary = {
  memberId: 1,
  userAccountId: 100,
  email: "alice@example.com",
  providerType: "GOOGLE",
  nickname: "alice",
  authorityTier: "AM",
  lastLoginAt: "2026-04-28T10:00:00",
  createdAt: "2026-01-15T09:00:00",
  withdrawn: false,
  withdrawnAt: null,
}

export const memberSummaryWithdrawnFixture: AdminMemberSummary = {
  ...memberSummaryFixture,
  memberId: 2,
  email: "bob@example.com",
  nickname: "bob",
  withdrawn: true,
  withdrawnAt: "2026-04-20T12:00:00",
}

export const memberDetailFixture: AdminMemberDetail = {
  memberId: 1,
  userAccount: {
    userAccountId: 100,
    email: "alice@example.com",
    providerType: "GOOGLE",
    createdAt: "2026-01-15T09:00:00",
  },
  profile: {
    nickname: "alice",
    introduction: "안녕하세요",
  },
  authorityTier: "AM",
  createdAt: "2026-01-15T09:00:00",
  recentActivityLog: [
    { occurredAt: "2026-04-28T10:00:00", type: "LOGIN", summary: "로그인" },
  ],
}

// 14c mutation error fixtures (per-test server.use 시 사용)
export const tierUnchangedErrorFixture = {
  status: 400,
  errorCode: "TIER_UNCHANGED",
  message: "동일 등급",
}

export const memberNotFoundErrorFixture = {
  status: 404,
  errorCode: "MEMBER_NOT_FOUND",
  message: "회원을 찾을 수 없음",
}
