export type VirtualCrewStatus = "OFF" | "MANAGED"

export interface PoolPlacement {
  partyroomId: number
  partyroomTitle: string
  botCount: number
}

export interface PoolSummary {
  total: number
  idle: number
  placed: PoolPlacement[]
}

export interface SongPackListItem {
  id: number
  name: string
  description: string | null
  trackCount: number
}

export interface SongPackTrack {
  trackId: number
  name: string
  linkId: string
  duration: string
  thumbnailImage: string | null
}

export interface SongPackDetail {
  id: number
  name: string
  description: string | null
  tracks: SongPackTrack[]
}

export interface PersonaListItem {
  id: number
  name: string
  active: boolean
}

export interface Persona {
  id: number
  name: string
  instruction: string
  active: boolean
}

export interface VirtualCrewLiveStatus {
  status: VirtualCrewStatus
  targetCount: number | null
  djBotCount: number | null
  songPackId: number | null
  currentBotDjCount: number
}

export interface PartyroomVirtualCrewSummary {
  status: VirtualCrewStatus
  targetCount: number | null
  botDjCount: number
}

export interface AvatarCatalogItem {
  bodyUri: string
  name: string
  thumbnailUri: string
  combinable: boolean
  obtainableType: string | null
}

export interface BotRosterItem {
  userId: number
  nickname: string
  avatarBodyUri: string
  avatarIconUri: string
  placementRoomId: number | null
  placementRoomTitle: string | null
  personaId: number | null
  personaName: string | null
}
