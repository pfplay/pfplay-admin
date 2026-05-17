// 어드민 UI에 노출되는 모든 enum status의 한글 라벨 + Badge variant 매핑.
// 어드민 사용자(엔지니어 아님)에게 raw enum 값(TERMINATED, PUBLISHED 등)이 노출되지 않도록 centralize.
// 색상 일관성을 위해 도메인 status 군은 success(긍정/active) / warning(intermediate) / muted(terminal) /
// default(중립/주목) 4 톤으로 분류 — 자세한 매핑은 G10 commit message 참조.

import type {
  PartyroomStatus,
  StageType,
} from "@/entities/partyroom"
import type {
  LifecycleStatus,
  ObtainmentType,
} from "@/entities/avatar"
import type {
  ReportStatus,
  ReportCategory,
} from "@/entities/report"
import type { AuthorityTier } from "@/entities/member"
import type { AdminRole } from "@/entities/administrator"
import type {
  AnnouncementType,
  AnnouncementSeverity,
} from "@/entities/announcement"
import type { BulkActionType } from "@/features/partyrooms/model/bulk-schema"

type StatusVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "muted"

interface Mapping<K extends string> {
  label: Record<K, string>
  variant: Record<K, StatusVariant>
}

export const PARTYROOM_STATUS: Mapping<PartyroomStatus> = {
  label: {
    ACTIVE: "활성",
    SUSPENDED: "일시 정지됨",
    TERMINATED: "종료됨",
  },
  variant: {
    ACTIVE: "success",
    SUSPENDED: "warning",
    TERMINATED: "muted",
  },
}

export const STAGE_TYPE: Mapping<StageType> = {
  label: { MAIN: "메인", GENERAL: "일반" },
  variant: { MAIN: "default", GENERAL: "outline" },
}

// DisplayFlag는 backend가 string union이라 forward-compat: 알 수 없는 값은 raw 표시.
export const DISPLAY_FLAG_LABEL: Record<string, string> = {
  NORMAL: "일반",
  FEATURED: "추천",
  HIDDEN: "숨겨짐",
}
export const DISPLAY_FLAG_VARIANT: Record<string, StatusVariant> = {
  NORMAL: "outline",
  FEATURED: "success",
  HIDDEN: "muted",
}

export const LIFECYCLE_STATUS: Mapping<LifecycleStatus> = {
  label: {
    DRAFT: "초안",
    PUBLISHED: "게시됨",
    RETIRED: "회수됨",
  },
  variant: {
    DRAFT: "warning",
    PUBLISHED: "success",
    RETIRED: "muted",
  },
}

export const OBTAINMENT_TYPE_LABEL: Record<ObtainmentType, string> = {
  BASIC: "기본",
  DJ_PNT: "DJ 포인트",
  REF_LINK: "추천 링크",
  ROOM_ACT: "룸 활동",
}

export const REPORT_STATUS: Mapping<ReportStatus> = {
  label: {
    PENDING: "대기 중",
    REVIEWING: "검토 중",
    RESOLVED: "해결됨",
    DISMISSED: "기각됨",
  },
  variant: {
    PENDING: "warning",
    REVIEWING: "default",
    RESOLVED: "success",
    DISMISSED: "muted",
  },
}

// ReportCategory는 backend enum value가 영문이라 한글 노출이 강하게 요구됨.
// 기존 widget이 inline으로 박아둔 매핑을 centralize.
export const REPORT_CATEGORY_LABEL: Record<ReportCategory, string> = {
  INAPPROPRIATE_CONTENT: "부적절 콘텐츠",
  HARASSMENT: "괴롭힘",
  SPAM: "스팸",
  COPYRIGHT: "저작권",
  OTHER: "기타",
}

export const TIER: Mapping<AuthorityTier> = {
  label: {
    FM: "정회원",
    AM: "준회원",
    GT: "게스트",
  },
  variant: {
    FM: "default",
    AM: "secondary",
    GT: "destructive",
  },
}

export const ADMIN_ROLE: Mapping<AdminRole> = {
  label: {
    SUPER_ADMIN: "슈퍼어드민",
    ADMIN: "어드민",
  },
  variant: {
    SUPER_ADMIN: "destructive",
    ADMIN: "default",
  },
}

export const ANNOUNCEMENT_TYPE: Mapping<AnnouncementType> = {
  label: {
    MAINTENANCE_NOTICE: "점검 공지",
    EVENT: "이벤트",
    EMERGENCY: "긴급 공지",
  },
  variant: {
    MAINTENANCE_NOTICE: "warning",
    EVENT: "default",
    EMERGENCY: "destructive",
  },
}

export const ANNOUNCEMENT_SEVERITY: Mapping<AnnouncementSeverity> = {
  label: {
    INFO: "정보",
    WARN: "경고",
    CRITICAL: "위급",
  },
  variant: {
    INFO: "secondary",
    WARN: "warning",
    CRITICAL: "destructive",
  },
}

export type AnnouncementDerivedStatus =
  | "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "SENT"

export const ANNOUNCEMENT_DERIVED_STATUS: Mapping<AnnouncementDerivedStatus> = {
  label: {
    PLANNED: "예정",
    ACTIVE: "진행중",
    COMPLETED: "정상완료",
    CANCELLED: "철회",
    SENT: "송출됨",
  },
  variant: {
    PLANNED: "warning",
    ACTIVE: "success",
    COMPLETED: "muted",
    CANCELLED: "muted",
    SENT: "default",
  },
}

// 우선순위: 철회 > 완료 > 진행중 > (점검이면 예정 / 그 외 송출됨)
export function deriveAnnouncementStatus(a: {
  type: "MAINTENANCE_NOTICE" | "EVENT" | "EMERGENCY"
  maintenanceStartedAt: string | null
  cancelledAt: string | null
  completedAt: string | null
}): AnnouncementDerivedStatus {
  if (a.cancelledAt) return "CANCELLED"
  if (a.completedAt) return "COMPLETED"
  if (a.maintenanceStartedAt) return "ACTIVE"
  return a.type === "MAINTENANCE_NOTICE" ? "PLANNED" : "SENT"
}

// 파티룸 상세 "최근 관리자 액션" 표 actionType.
// backend `PartyroomAdminActionType` enum 11종. 알 수 없는 값은 raw 표시 (forward-compat).
export const PARTYROOM_ADMIN_ACTION_TYPE_LABEL: Record<string, string> = {
  SUSPEND_PARTYROOM: "일시 정지",
  RESTORE_PARTYROOM: "재개",
  TERMINATE_PARTYROOM: "강제 종료",
  SET_FEATURED: "추천 표시",
  SET_HIDDEN: "숨김 처리",
  SET_NORMAL: "일반 표시",
  UPDATE_PARTYROOM_META: "메타 수정",
  PENALIZE_CREW: "페널티 부여",
  RELEASE_CREW_PENALTY: "페널티 해제",
  PUBLISH_AVATAR_RESOURCE: "아바타 게시",
  RETIRE_AVATAR_RESOURCE: "아바타 회수",
}

// DisplayFlag inline 표기 (action metadata old_flag/new_flag 풀이용 — 짧은 형식)
const DISPLAY_FLAG_INLINE_LABEL: Record<string, string> = {
  NORMAL: "일반",
  FEATURED: "추천",
  HIDDEN: "숨김",
}

/**
 * 파티룸 admin action row의 metadata를 사람이 읽을 수 있는 한 줄로 변환.
 * backend `PartyroomAdminActionListener`가 채우는 형태에 맞춰 actionType별 분기.
 * 알 수 없는 actionType이면 raw JSON fallback (forward-compat).
 */
export function formatPartyroomAdminActionMetadata(
  actionType: string,
  metadata: Record<string, unknown> | null,
): string {
  if (!metadata || Object.keys(metadata).length === 0) return "—"

  switch (actionType) {
    case "SET_FEATURED":
    case "SET_HIDDEN":
    case "SET_NORMAL": {
      const oldFlag = metadata["old_flag"]
      const newFlag = metadata["new_flag"]
      if (typeof oldFlag === "string" && typeof newFlag === "string") {
        const oldL = DISPLAY_FLAG_INLINE_LABEL[oldFlag] ?? oldFlag
        const newL = DISPLAY_FLAG_INLINE_LABEL[newFlag] ?? newFlag
        return `${oldL} → ${newL}`
      }
      return JSON.stringify(metadata)
    }
    case "UPDATE_PARTYROOM_META": {
      const changes = metadata["changes"]
      if (changes && typeof changes === "object") {
        const keys = Object.keys(changes as Record<string, unknown>)
        return keys.length > 0 ? `변경 필드: ${keys.join(", ")}` : "—"
      }
      return JSON.stringify(metadata)
    }
    case "PENALIZE_CREW": {
      const ptype = metadata["penalty_type"]
      const historyId = metadata["crew_penalty_history_id"]
      const ptypeL =
        typeof ptype === "string"
          ? PENALTY_TYPE_LABEL[ptype] ?? ptype
          : "페널티"
      return historyId ? `${ptypeL} (#${historyId})` : ptypeL
    }
    case "RELEASE_CREW_PENALTY": {
      const historyId = metadata["crew_penalty_history_id"]
      return historyId ? `페널티 #${historyId} 해제` : "—"
    }
    case "SUSPEND_PARTYROOM":
    case "RESTORE_PARTYROOM":
    case "TERMINATE_PARTYROOM":
      // listener가 빈 metadata를 발행. 들어오는 일이 없을 텐데 안전장치.
      return "—"
    default:
      return JSON.stringify(metadata)
  }
}

export const BULK_ACTION_LABEL: Record<BulkActionType, string> = {
  TERMINATE: "강제 종료",
  SUSPEND: "일시 정지",
  SET_HIDDEN: "표시 숨김",
}

// === user_activity_log eventType ===
//
// backend `UserActivityEventType` 10종 + SIGNED_IN은 metadata.actor_type으로 어드민 로그인 vs
// 일반 사용자 로그인 구분 (같은 user_account_id가 양쪽 다 사용 가능 — admin이 본인 계정으로
// pfplay-web에도 로그인 가능). admin UI는 이를 한 줄로 풀어 표시.

const USER_ACTIVITY_EVENT_TYPE_LABEL: Record<string, string> = {
  SIGNED_UP: "가입",
  SIGNED_IN: "로그인",
  WITHDREW: "탈퇴",
  PROFILE_UPDATED: "프로필 변경",
  TIER_CHANGED: "등급 변경",
  PARTYROOM_CREATED: "파티룸 생성",
  PARTYROOM_ENTERED: "파티룸 입장",
  PARTYROOM_EXITED: "파티룸 퇴장",
  PENALIZED_IN_PARTYROOM: "페널티 받음",
  ADMIN_ACTED_ON: "어드민 처리 대상",
}

/**
 * Activity log row의 event 라벨을 metadata 맥락 함께 풀어 사람이 읽을 수 있는 형태로 반환.
 *
 * 특수 처리:
 * - SIGNED_IN + metadata.actor_type=ADMINISTRATOR → "로그인 (어드민 콘솔)"
 * - SIGNED_IN + metadata.actor_type=USER (또는 부재) → "로그인 (서비스)"
 */
export function formatActivityEventLabel(
  eventType: string,
  metadata: Record<string, unknown> | null,
): string {
  const base = USER_ACTIVITY_EVENT_TYPE_LABEL[eventType] ?? eventType
  if (eventType === "SIGNED_IN") {
    const actorType = metadata?.["actor_type"]
    if (actorType === "ADMINISTRATOR") return `${base} (어드민 콘솔)`
    return `${base} (서비스)`
  }
  return base
}

// backend `PenaltyType` enum 한글 라벨 — activity log metadata + partyroom 상세 페널티 표 공용
export const PENALTY_TYPE_LABEL: Record<string, string> = {
  CHAT_MESSAGE_REMOVAL: "채팅 메시지 삭제",
  CHAT_BAN_30_SECONDS: "30초 채팅 금지",
  ONE_TIME_EXPULSION: "1회 강제 퇴장",
  PERMANENT_EXPULSION: "영구 강제 퇴장",
}

// backend `PunisherType` enum (또는 metadata.by 값) 한글 라벨
export const PUNISHER_TYPE_LABEL: Record<string, string> = {
  ADMIN: "어드민",
  CREW: "크루",
}

// backend 도메인 enum 한글 라벨 — activity log metadata 풀어 표시 용
const PROFILE_CHANGE_TYPE_LABEL: Record<string, string> = {
  BIO: "자기소개",
  AVATAR: "아바타",
}

// metadata.action_type (ADMIN_ACTED_ON / WITHDREW row의 by-admin 표시 용)
const ADMIN_ACTION_LABEL: Record<string, string> = {
  TIER_CHANGED: "등급 변경",
  WITHDRAW: "탈퇴",
}

/**
 * Activity log row의 metadata를 사람이 읽을 수 있는 한 줄로 변환.
 * 알 수 없는 eventType은 raw JSON으로 fallback (debug 용).
 *
 * 정책:
 * - SIGNED_IN/SIGNED_UP — actor_type/provider는 이벤트 라벨에 이미 포함되거나 단순. 여기선 provider만 짧게.
 * - TIER_CHANGED — `정회원 → 게스트 (어드민 #N)` 형식
 * - PARTYROOM_CREATED — `메인 스테이지` / `일반 스테이지`
 * - PROFILE_UPDATED — `자기소개 / 아바타`
 * - PENALIZED_IN_PARTYROOM — `30초 채팅 금지 (어드민 #N)` / `(크루)`
 * - WITHDREW — `본인 탈퇴` / `어드민 #N 처리`
 * - ADMIN_ACTED_ON — `등급 변경 (어드민 #N)` 형식
 */
export function formatActivityMetadata(
  eventType: string,
  metadata: Record<string, unknown> | null,
): string {
  if (!metadata || Object.keys(metadata).length === 0) return "—"

  const provider = metadata["provider"]
  const byAdmin = metadata["by_administrator_id"]

  switch (eventType) {
    case "SIGNED_IN":
      // 라벨에 actor_type/provider 모두 흡수됨
      return "—"
    case "SIGNED_UP":
      return provider ? String(provider) : "—"
    case "WITHDREW":
      return byAdmin ? `어드민 #${byAdmin} 처리` : "본인 탈퇴"
    case "TIER_CHANGED": {
      const oldTier = metadata["old_tier"]
      const newTier = metadata["new_tier"]
      if (typeof oldTier !== "string" || typeof newTier !== "string") {
        return JSON.stringify(metadata)
      }
      const tierStr = `${TIER.label[oldTier as AuthorityTier] ?? oldTier} → ${TIER.label[newTier as AuthorityTier] ?? newTier}`
      return byAdmin ? `${tierStr} (어드민 #${byAdmin})` : tierStr
    }
    case "PROFILE_UPDATED": {
      const ct = metadata["change_type"]
      return typeof ct === "string"
        ? PROFILE_CHANGE_TYPE_LABEL[ct] ?? ct
        : "—"
    }
    case "PARTYROOM_CREATED": {
      const stage = metadata["stage_type"]
      if (typeof stage !== "string") return "—"
      const label = STAGE_TYPE.label[stage as StageType] ?? stage
      return `${label} 스테이지`
    }
    case "PARTYROOM_ENTERED":
    case "PARTYROOM_EXITED":
      return "—"
    case "PENALIZED_IN_PARTYROOM": {
      const ptype = metadata["penalty_type"]
      const by = metadata["by"]
      const ptypeStr =
        typeof ptype === "string"
          ? PENALTY_TYPE_LABEL[ptype] ?? ptype
          : "페널티"
      const sourceStr =
        by === "ADMIN" ? `어드민${byAdmin ? ` #${byAdmin}` : ""}` : "크루"
      return `${ptypeStr} (${sourceStr})`
    }
    case "ADMIN_ACTED_ON": {
      const action = metadata["action_type"]
      const actionStr =
        typeof action === "string"
          ? ADMIN_ACTION_LABEL[action] ?? action
          : "—"
      return byAdmin ? `${actionStr} (어드민 #${byAdmin})` : actionStr
    }
    default:
      return JSON.stringify(metadata)
  }
}
