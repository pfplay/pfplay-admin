import type {
  AdminReportSummary,
  AdminReportDetail,
} from "@/entities/report"

export const reportSummaryFixture: AdminReportSummary = {
  reportId: 1,
  partyroomId: 100,
  reporterUserAccountId: 5,
  category: "INAPPROPRIATE_CONTENT",
  status: "PENDING",
  createdAt: "2026-04-28T10:00:00",
  reviewedByAdministratorId: null,
  resolvedAt: null,
}

export const reportListPageFixture = {
  content: [
    reportSummaryFixture,
    {
      ...reportSummaryFixture,
      reportId: 2,
      category: "HARASSMENT" as const,
      status: "REVIEWING" as const,
      reviewedByAdministratorId: 99,
    },
    {
      ...reportSummaryFixture,
      reportId: 3,
      category: "SPAM" as const,
      status: "RESOLVED" as const,
      reviewedByAdministratorId: 99,
      resolvedAt: "2026-04-29T11:00:00",
    },
    {
      ...reportSummaryFixture,
      reportId: 4,
      category: "COPYRIGHT" as const,
      status: "DISMISSED" as const,
      reviewedByAdministratorId: 99,
      resolvedAt: "2026-04-29T12:00:00",
    },
    {
      ...reportSummaryFixture,
      reportId: 5,
      category: "OTHER" as const,
      status: "PENDING" as const,
    },
  ],
  totalElements: 5,
  totalPages: 1,
  number: 0,
  size: 50,
  first: true,
  last: true,
  empty: false,
  numberOfElements: 5,
}

export const reportDetailFixture: AdminReportDetail = {
  reportId: 1,
  status: "PENDING",
  category: "INAPPROPRIATE_CONTENT",
  description: "부적절한 음악 트랙이 재생되고 있습니다.\n신고 처리 부탁드립니다.",
  reporter: {
    userAccountId: 5,
    email: "reporter@example.com",
    nickname: "신고자닉",
  },
  partyroom: {
    partyroomId: 100,
    title: "테스트 파티룸",
    host: { userAccountId: 200, nickname: "호스트닉" },
  },
  review: {
    reviewedByAdministratorId: null,
    resolutionNote: null,
    resolvedAt: null,
  },
  createdAt: "2026-04-28T10:00:00",
}

export const reportDetailOrphanFixture: AdminReportDetail = {
  reportId: 2,
  status: "REVIEWING",
  category: "HARASSMENT",
  description: "삭제된 파티룸 신고",
  reporter: {
    userAccountId: 5,
    email: null,
    nickname: null, // reporter member 삭제됨
  },
  partyroom: {
    partyroomId: 999,
    title: null, // partyroom 삭제됨
    host: null,
  },
  review: {
    reviewedByAdministratorId: 99,
    resolutionNote: null,
    resolvedAt: null,
  },
  createdAt: "2026-04-28T11:00:00",
}

export const reportNotFoundErrorFixture = {
  status: 404,
  errorCode: "RPT-001",
  message: "신고가 존재하지 않습니다.",
}

export const invalidStateTransitionErrorFixture = {
  status: 400,
  errorCode: "RPT-002",
  message: "허용되지 않는 신고 상태 전이입니다.",
}

export const resolutionNoteRequiredErrorFixture = {
  status: 400,
  errorCode: "RPT-003",
  message: "처리 완료(RESOLVED/DISMISSED) 시 처리 메모가 필요합니다.",
}
