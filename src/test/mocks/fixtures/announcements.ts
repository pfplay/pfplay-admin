import type {
  Announcement,
  AnnouncementListResponse,
  CreateAnnouncementResponse,
} from "@/entities/announcement"

export const maintenanceNoticeFixture: Announcement = {
  id: 101,
  type: "MAINTENANCE_NOTICE",
  severity: "WARN",
  titleKo: "정기 점검 안내",
  titleEn: "Scheduled Maintenance",
  messageKo: "5/4 03:00 ~ 04:00 (KST) 정기 점검을 진행합니다.",
  messageEn: "Service will be down 03:00–04:00 KST on May 4.",
  scheduledStartAt: "2026-05-04T03:00:00",
  scheduledEndAt: "2026-05-04T04:00:00",
  expiresAt: null,
  sentAt: "2026-05-03T15:00:00",
  sentByAdministratorId: 1,
  maintenanceStartedAt: null,
  cancelledAt: null,
}

export const eventFixture: Announcement = {
  id: 102,
  type: "EVENT",
  severity: "INFO",
  titleKo: "5월 이벤트 시작",
  titleEn: "May Event Starts",
  messageKo: "이벤트 페이지를 확인해주세요.",
  messageEn: "Check the event page for details.",
  scheduledStartAt: null,
  scheduledEndAt: null,
  expiresAt: "2026-05-15T23:59:00",
  sentAt: "2026-05-01T09:00:00",
  sentByAdministratorId: 2,
  maintenanceStartedAt: null,
  cancelledAt: null,
}

export const emergencyCancelledFixture: Announcement = {
  id: 103,
  type: "EMERGENCY",
  severity: "CRITICAL",
  titleKo: "긴급 공지 — 취소됨",
  titleEn: "Emergency notice — cancelled",
  messageKo: "오작동으로 인한 송출 — 정정합니다.",
  messageEn: "Sent in error — cancelled.",
  scheduledStartAt: null,
  scheduledEndAt: null,
  expiresAt: null,
  sentAt: "2026-04-30T20:00:00",
  sentByAdministratorId: 1,
  maintenanceStartedAt: null,
  cancelledAt: "2026-04-30T20:05:00",
}

export const announcementListFixture: AnnouncementListResponse = {
  content: [maintenanceNoticeFixture, eventFixture, emergencyCancelledFixture],
  totalElements: 3,
  totalPages: 1,
  number: 0,
  size: 20,
}

export const createAnnouncementResponseFixture: CreateAnnouncementResponse = {
  announcementId: 999,
}

export const annNotFoundError = {
  status: 404,
  errorCode: "ANN-001",
  message: "공지를 찾을 수 없습니다.",
}

export const annAlreadyCancelledError = {
  status: 409,
  errorCode: "ANN-002",
  message: "이미 취소된 공지입니다.",
}

export const annInvalidScheduleForTypeError = {
  status: 400,
  errorCode: "ANN-003",
  message: "공지 종류와 일정 정보가 일치하지 않습니다.",
}

export const annInvalidScheduleWindowError = {
  status: 400,
  errorCode: "ANN-004",
  message: "종료 시각은 시작 시각 이후여야 합니다.",
}

export const annScheduledStartInPastError = {
  status: 400,
  errorCode: "ANN-005",
  message: "시작 시각은 현재 이후여야 합니다.",
}
