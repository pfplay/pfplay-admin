export interface VirtualUser {
  id: string
  username: string
  email: string
  profileImage?: string
  tier: "free" | "premium" | "vip"
  status: "active" | "inactive"
  isInRoom: boolean
  currentRoomId?: string
  createdAt: Date
  lastActiveAt: Date
}
