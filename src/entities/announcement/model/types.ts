/**
 * Backend mirror — `pfplay-platform` V14 시스템 공지 도메인.
 *
 * - `AnnouncementType`
 *   * MAINTENANCE_NOTICE: scheduledStartAt + scheduledEndAt 필수.
 *     scheduler 가 startAt 도달 시 phase ACTIVE 토글 + MAINTENANCE_STARTED ws 이벤트.
 *   * EVENT / EMERGENCY: scheduler 토글 없음. expiresAt optional (자동 dismiss).
 * - `AnnouncementSeverity`: pfplay-web 측 presentation 분기 (toast/banner/persistent).
 * - admin 콘솔: 송출(POST), 이력(GET), 철회(DELETE), 종료시각 조정(PATCH /schedule, ACTIVE 한정),
 *   즉시 정상종료(POST /complete).
 *
 * 모든 타임스탬프는 LocalDateTime ISO (KST 가정 — 14b §11 footer 일관).
 */

export type AnnouncementType = "MAINTENANCE_NOTICE" | "EVENT" | "EMERGENCY"
export type AnnouncementSeverity = "INFO" | "WARN" | "CRITICAL"

export interface Announcement {
  id: number
  type: AnnouncementType
  severity: AnnouncementSeverity
  titleKo: string
  titleEn: string
  messageKo: string
  messageEn: string
  /** MAINTENANCE_NOTICE 일 때 채워짐. EVENT/EMERGENCY 는 null. */
  scheduledStartAt: string | null
  scheduledEndAt: string | null
  /** EVENT/EMERGENCY 에서 optional. MAINTENANCE_NOTICE 는 null. */
  expiresAt: string | null
  sentAt: string
  sentByAdministratorId: number
  /** scheduler 가 phase ACTIVE 로 토글한 시각. NULL = 아직 시작 전 / 점검 외 type. */
  maintenanceStartedAt: string | null
  /** admin DELETE 호출 시각. NULL = 활성 (취소 가능). */
  cancelledAt: string | null
  /** scheduler 자동 또는 admin /complete 로 정상 종료된 시각. NULL = 정상완료된 적 없음. */
  completedAt: string | null
}

export interface CreateAnnouncementResponse {
  announcementId: number
}

/** Spring Page 형태 — backend pageable 응답 1:1. */
export interface AnnouncementListResponse {
  content: Announcement[]
  totalElements: number
  totalPages: number
  /** 0-based page index */
  number: number
  size: number
}
