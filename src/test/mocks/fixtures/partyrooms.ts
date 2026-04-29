import type { AdminPartyroomListItem, AdminPartyroomDetail } from "@/entities/partyroom"

export const partyroomListItemFixture: AdminPartyroomListItem = {
  partyroomId: 1,
  title: "테스트 파티룸",
  stageType: "GENERAL",
  hostUserAccountId: 100,
  hostNickname: "alice",
  crewCount: 5,
  djCount: 2,
  playbackActivated: true,
  status: "ACTIVE",
  displayFlag: "PUBLIC", // 실제 enum 값은 G7에서 확정
  createdAt: "2026-04-25T10:00:00",
  lastActivityAt: "2026-04-28T11:00:00",
}

export const partyroomDetailFixture: AdminPartyroomDetail = {
  partyroomId: 1,
  title: "테스트 파티룸",
  status: "ACTIVE",
  displayFlag: "PUBLIC",
  hostUserAccountId: 100,
  hostNickname: "alice",
  hostEmail: "alice@example.com",
  crewCount: 5,
  lastActivityAt: "2026-04-28T11:00:00",
  stageType: "GENERAL",
  playback: { activated: true, currentTrackName: null, currentDjCrewId: 10 },
  crews: [
    { crewId: 10, memberId: 1, gradeType: "DJ", nickname: "alice", enteredAt: "2026-04-25T10:00:00" },
  ],
  djQueue: [
    { djId: 5, crewId: 10, playlistName: null, orderNumber: 1 },
  ],
  recentPenalties: [],
  recentReports: [],
  recentAdminActions: [],
}

// 14c mutation error fixtures (per-test server.use 시 사용)
export const alreadyTerminatedErrorFixture = {
  status: 403,
  errorCode: "ALREADY_TERMINATED",
  message: "이미 종료된 룸",
}

export const illegalStateTransitionErrorFixture = {
  status: 409,
  errorCode: "ILLEGAL_STATE_TRANSITION",
  message: "현재 상태에서 불가",
}

export const partyroomNotFoundErrorFixture = {
  status: 404,
  errorCode: "NOT_FOUND_ROOM",
  message: "존재하지 않는 룸",
}

// 14d bulk-action result fixtures (per-test server.use override 시 사용)
export const bulkResultAllSuccess = (ids: number[]) => ({
  results: ids.map((id) => ({ partyroomId: id, success: true, error: null })),
})

export const bulkResultPartial = (ids: number[]) => ({
  results: ids.map((id, i) => ({
    partyroomId: id,
    success: i % 2 === 0,
    error: i % 2 === 0 ? null : "이미 종료된 파티룸입니다",
  })),
})

export const bulkResultAllFail = (ids: number[]) => ({
  results: ids.map((id) => ({
    partyroomId: id,
    success: false,
    error: "INTERNAL_ERROR",
  })),
})

/**
 * skipErrors=false 시 첫 실패에서 break — breakAt index부터 results 배열 미포함.
 * 호출자가 "미시도 Z건 = ids.length - results.length"로 계산.
 */
export const bulkResultBreak = (ids: number[], breakAt: number) => ({
  results: ids.slice(0, breakAt).map((id, i) => ({
    partyroomId: id,
    success: i < breakAt - 1,
    error: i < breakAt - 1 ? null : "이미 종료된 파티룸입니다",
  })),
})
