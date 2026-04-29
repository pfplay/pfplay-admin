import type {
  AdminAvatarBodyView,
  AdminAvatarFaceView,
} from "@/entities/avatar"

export const bodyDraftFixture: AdminAvatarBodyView = {
  id: 1,
  name: "Body 1 (DRAFT)",
  resourceUri: "https://gcs.example.com/avatars/bodies/1.png",
  iconUri: "https://gcs.example.com/avatars/bodies/1-icon.png",
  obtainableType: "BASIC",
  obtainableScore: 0,
  isCombinable: true,
  isDefaultSetting: false,
  combinePositionX: 0,
  combinePositionY: 0,
  lifecycleStatus: "DRAFT",
  createdAt: "2026-04-25T10:00:00",
  createdBy: 99,
  updatedAt: "2026-04-25T10:00:00",
  updatedBy: 99,
}

export const bodyPublishedFixture: AdminAvatarBodyView = {
  ...bodyDraftFixture,
  id: 2,
  name: "Body 2 (PUBLISHED)",
  obtainableType: "DJ_PNT",
  obtainableScore: 100,
  lifecycleStatus: "PUBLISHED",
}

export const bodyRetiredFixture: AdminAvatarBodyView = {
  ...bodyDraftFixture,
  id: 3,
  name: "Body 3 (RETIRED)",
  obtainableType: "REF_LINK",
  obtainableScore: 50,
  lifecycleStatus: "RETIRED",
}

export const bodyListFixture: AdminAvatarBodyView[] = [
  bodyDraftFixture,
  bodyPublishedFixture,
  bodyRetiredFixture,
  { ...bodyDraftFixture, id: 4, name: "Body 4 (default)", obtainableType: "BASIC", isDefaultSetting: true, lifecycleStatus: "PUBLISHED" },
  { ...bodyDraftFixture, id: 5, name: "Body 5", obtainableType: "ROOM_ACT", obtainableScore: 200, lifecycleStatus: "DRAFT" },
]

export const faceDraftFixture: AdminAvatarFaceView = {
  id: 1,
  name: "Face 1 (DRAFT)",
  resourceUri: "https://gcs.example.com/avatars/faces/1.png",
  iconUri: "https://gcs.example.com/avatars/faces/1-icon.png",
  obtainableType: "BASIC",
  lifecycleStatus: "DRAFT",
  createdAt: "2026-04-25T10:00:00",
  createdBy: 99,
  updatedAt: "2026-04-25T10:00:00",
  updatedBy: 99,
}

export const facePublishedFixture: AdminAvatarFaceView = {
  ...faceDraftFixture,
  id: 2,
  name: "Face 2 (PUBLISHED)",
  obtainableType: "DJ_PNT",
  lifecycleStatus: "PUBLISHED",
}

export const faceListFixture: AdminAvatarFaceView[] = [
  faceDraftFixture,
  facePublishedFixture,
  { ...faceDraftFixture, id: 3, name: "Face 3 (RETIRED)", lifecycleStatus: "RETIRED" },
]

export const avatarNotFoundErrorFixture = {
  status: 404,
  errorCode: "AVT-009",
  message: "아바타 리소스를 찾을 수 없습니다.",
}

export const avatarInvalidLifecycleErrorFixture = {
  status: 409,
  errorCode: "AVT-005",
  message: "허용되지 않은 라이프사이클 전이입니다.",
}
