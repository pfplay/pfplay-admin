// #39 대시보드 v1 — 전역 일별 입퇴장 (platform #361 응답 계약)
export interface AttendanceDaily {
  date: string // yyyy-MM-dd
  entered: number
  exited: number
  uniqueVisitors: number
}

export interface AttendanceSummary {
  totalEntered: number
  totalExited: number
  uniqueVisitors: number
  activeRoomCount: number
  /** totalExited/totalEntered. 입장 0건이면 null. 퇴장 이벤트 유실(신호 유실 유령)로 1.0 미만이 정상. */
  exitRecordRate: number | null
}

export interface AttendanceAnalyticsResponse {
  days: number
  excludeBots: boolean
  summary: AttendanceSummary
  daily: AttendanceDaily[]
}
