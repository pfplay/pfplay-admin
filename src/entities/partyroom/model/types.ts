import type { PartyroomVirtualDjSummary } from "@/entities/virtual-dj"

export type PartyroomStatus = "ACTIVE" | "SUSPENDED" | "TERMINATED"
export type StageType = "MAIN" | "GENERAL"

// 다음 enum은 14b detail 뱃지/section 라벨 용도. 실제 값은 G7/G8에서 backend 확정 후 union 좁히기 (§12 catch-up 항목 7).
// 안전을 위해 string으로 두고 렌더 단에서 unknown fallback ("미정의: XYZ").
export type DisplayFlag = string
export type GradeType = string
export type PenaltyType = string
export type PartyroomAdminActionType = string

export interface AdminPartyroomPlaybackSummary {
  activated: boolean
  currentTrackName: string | null
  currentDjCrewId: number | null
}

export interface CrewSummary {
  crewId: number
  memberId: number
  gradeType: GradeType
  nickname: string | null
  enteredAt: string
}

export interface DjSummary {
  djId: number
  crewId: number
  playlistName: string | null
  orderNumber: number
}

export interface PenaltySummary {
  id: number
  crewId: number
  penaltyType: PenaltyType
  punisherType: string
  reason: string
  date: string
}

export interface ReportSummary {
  id: number
  category: string
  status: string
  reporterUserAccountId: number
  createdAt: string
}

export interface AdminActionSummary {
  actionId: number
  actionType: PartyroomAdminActionType
  administratorId: number
  occurredAt: string
  /**
   * actionType별 metadata 형태 (backend `PartyroomAdminActionListener` 기준):
   *  - SET_FEATURED/SET_HIDDEN/SET_NORMAL: `{ old_flag, new_flag }` (FEATURED/HIDDEN/NORMAL)
   *  - UPDATE_PARTYROOM_META: `{ changes: { ... } }`
   *  - PENALIZE_CREW: `{ penalty_type, crew_penalty_history_id? }`
   *  - RELEASE_CREW_PENALTY: `{ crew_penalty_history_id }`
   *  - SUSPEND/RESTORE/TERMINATE: 비어 있음 (reason은 backend가 별 컬럼에 저장)
   *  - PUBLISH/RETIRE_AVATAR_RESOURCE: avatar listener 별도 (구조 미확인)
   */
  metadata: Record<string, unknown> | null
}

export interface AdminPartyroomListItem {
  partyroomId: number
  title: string
  stageType: StageType
  hostUserAccountId: number
  hostNickname: string | null
  crewCount: number
  djCount: number
  playbackActivated: boolean
  status: PartyroomStatus
  displayFlag: DisplayFlag
  createdAt: string
  lastActivityAt: string | null
  /** P2 가상 DJ 요약 (backend Task 2.2). config 없으면 null. */
  virtualDj?: PartyroomVirtualDjSummary | null
}

export interface AdminPartyroomDetail {
  partyroomId: number
  title: string
  introduction: string | null
  status: PartyroomStatus
  displayFlag: DisplayFlag
  hostUserAccountId: number
  hostNickname: string | null
  hostEmail: string | null
  crewCount: number
  lastActivityAt: string | null
  stageType: StageType
  playbackTimeLimit: number | null
  playback: AdminPartyroomPlaybackSummary
  crews: CrewSummary[]
  djQueue: DjSummary[]
  recentPenalties: PenaltySummary[]
  recentReports: ReportSummary[]
  recentAdminActions: AdminActionSummary[]
}
