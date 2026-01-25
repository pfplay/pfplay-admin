export interface PartyRoom {
  id: number
  name: string
  stageType: "MAIN" | "GENERAL"
  linkDomain: string
  crewCount: number
  djCount: number
  isPlaybackActivated: boolean
}
