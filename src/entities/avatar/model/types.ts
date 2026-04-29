/**
 * Backend mirror — `pfplay-platform/avatar` BC + `AdminAvatar*View` records.
 *
 * - `LifecycleStatus`: DRAFT → PUBLISHED → RETIRED (transitionable)
 * - `ObtainmentType`: BASIC / DJ_PNT / REF_LINK / ROOM_ACT (body 표시 + filter, face 표시만)
 * - `AdminAvatarBodyView` / `AdminAvatarFaceView`: 어드민 카탈로그 view (audit 컬럼 포함)
 * - `AvatarResourceType`: frontend discriminator (URL path + tab + hook generic)
 */

export type LifecycleStatus = "DRAFT" | "PUBLISHED" | "RETIRED"

export type ObtainmentType = "BASIC" | "DJ_PNT" | "REF_LINK" | "ROOM_ACT"

export type AvatarResourceType = "body" | "face"

export interface AdminAvatarBodyView {
  id: number
  name: string
  resourceUri: string
  iconUri: string
  obtainableType: ObtainmentType
  obtainableScore: number
  isCombinable: boolean
  isDefaultSetting: boolean
  combinePositionX: number
  combinePositionY: number
  lifecycleStatus: LifecycleStatus
  /** LocalDateTime ISO (KST 가정 — 14b §11 footer 일관) */
  createdAt: string
  createdBy: number
  updatedAt: string
  updatedBy: number
}

export interface AdminAvatarFaceView {
  id: number
  name: string
  resourceUri: string
  iconUri: string
  obtainableType: ObtainmentType
  lifecycleStatus: LifecycleStatus
  createdAt: string
  createdBy: number
  updatedAt: string
  updatedBy: number
}

export type AdminAvatarView = AdminAvatarBodyView | AdminAvatarFaceView

export function isBodyView(v: AdminAvatarView): v is AdminAvatarBodyView {
  return "obtainableScore" in v
}
