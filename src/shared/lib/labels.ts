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
 *
 * 나머지 eventType은 metadata 사용 안 함 — 컬럼은 별도로 raw 노출.
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
