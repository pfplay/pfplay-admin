import type { AdminGuestSummary, AdminGuestDetail } from "@/entities/guest"

export const guestSummaryFixture: AdminGuestSummary = {
  guestId: 5001,
  userAccountId: 6001,
  email: "guest-fixture@d8.local",
  providerType: "GOOGLE",
  nickname: "guestNick",
  agent: "Mozilla/5.0 fixture-ua",
  isProfileUpdated: true,
  lastLoginAt: "2026-05-15T10:00:00",
  createdAt: "2026-05-10T00:00:00",
  withdrawn: false,
  withdrawnAt: null,
}

export const guestDetailFixture: AdminGuestDetail = {
  guestId: 5001,
  userAccount: {
    userAccountId: 6001,
    email: "guest-fixture@d8.local",
    providerType: "GOOGLE",
    lastLoginAt: "2026-05-15T10:00:00",
    withdrawnAt: null,
  },
  profile: { nickname: "guestNick", introduction: "Hello" },
  agent: "Mozilla/5.0 fixture-ua",
  isProfileUpdated: true,
  createdAt: "2026-05-10T00:00:00",
  withdrawn: false,
  withdrawnAt: null,
  recentActivityLog: [],
}
