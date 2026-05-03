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
