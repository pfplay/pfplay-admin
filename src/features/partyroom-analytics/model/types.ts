/** 파티룸 행동분석 — platform GET /admin/partyrooms/{id}/analytics 응답 미러. */
export interface DailyAttendanceBucket {
  date: string // ISO yyyy-MM-dd
  entered: number
  exited: number
}

export interface AttendanceAnalytics {
  totalEntered: number
  totalExited: number
  uniqueVisitors: number
  daily: DailyAttendanceBucket[]
}

export interface SilenceExit {
  approximate: boolean
  totalExits: number
  exitsDuringSilence: number
  silenceExitRatio: number | null
  totalSilenceMinutes: number
}

export interface PartyroomAnalytics {
  windowDays: number
  attendance: AttendanceAnalytics
  silenceExit: SilenceExit
}

/** 디제잉 이력 1건 — GET /admin/partyrooms/{id}/dj-history (페이지네이션). */
export interface DjHistoryItem {
  playbackId: number
  trackName: string
  djUserAccountId: number
  djNickname: string
  avatarIconUri: string
  thumbnailImage: string
  playedAt: string // ISO date-time
}
