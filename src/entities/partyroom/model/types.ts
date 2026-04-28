export type PartyroomStatus = "ACTIVE" | "SUSPENDED" | "TERMINATED"
export type StageType = "MAIN" | "GENERAL"

// 다음 enum은 14b detail 뱃지/section 라벨 용도. 실제 값은 G7/G8에서 backend 확정 후 union 좁히기 (§12 catch-up 항목 7).
// 안전을 위해 string으로 두고 렌더 단에서 unknown fallback ("미정의: XYZ").
export type DisplayFlag = string
export type GradeType = string
export type PenaltyType = string
export type PartyroomAdminActionType = string

export interface PlaybackSummary {
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
}

export interface AdminPartyroomDetail {
  partyroomId: number
  title: string
  status: PartyroomStatus
  displayFlag: DisplayFlag
  hostUserAccountId: number
  hostNickname: string | null
  hostEmail: string | null
  crewCount: number
  lastActivityAt: string | null
  stageType: StageType
  playback: PlaybackSummary
  crews: CrewSummary[]
  djQueue: DjSummary[]
  recentPenalties: PenaltySummary[]
  recentReports: ReportSummary[]
  recentAdminActions: AdminActionSummary[]
}
