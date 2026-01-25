// API Client for external backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"

// Demo API Types
export interface DemoStatus {
  initialized: boolean
  virtualMemberCount: number
  generalRoomCount: number
}

export interface DemoInitRequest {
  playbackTimeLimit: number
  titlePrefix?: string
  introduction?: string
  registerDjs?: boolean
}

export interface DemoInitResponse {
  totalMembers: number
  specialMembers: number
  totalPartyrooms: number
  totalDjsRegistered: number
  executionTimeMs: number
  mainStage: {
    partyroomId: number
    stageType: string
    title: string
    linkDomain: string
    hostUserId: string | null
    totalCrewCount: number
    djUserId: string
    playlistId: number
  }
  generalRooms: Array<{
    partyroomId: number
    stageType: string
    title: string
    linkDomain: string
    hostUserId: string
    totalCrewCount: number
    djUserId: string
    playlistId: number
  }>
}

export interface Partyroom {
  partyroomId: number
  stageType: string
  title: string
  linkDomain: string
  crewCount: number
  djCount: number
  isPlaybackActivated: boolean
}

export interface PartyroomsResponse {
  partyrooms: Partyroom[]
}

export interface ChatSimulationRequest {
  scriptType: "CHILL" | "HYPE"
}

export interface ChatSimulationResponse {
  partyroomId: number
  status: "STARTED" | "STOPPED"
  scriptType?: string
}

export interface ReactionSimulationResponse {
  partyroomId: number
  playbackId: number
  reactions: Array<{
    userId: string
    reactionType: string
    eventPublished: boolean
  }>
  aggregation: {
    likeCount: number
    dislikeCount: number
    grabCount: number
  }
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Unknown error" }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Users
  async getUsers() {
    return this.request<any>("/users")
  }

  async createUser(data: any) {
    return this.request("/users", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, { method: "DELETE" })
  }

  // Rooms
  async getRooms() {
    return this.request<any>("/rooms")
  }

  async createRoom(data: any) {
    return this.request("/rooms", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async deleteRoom(id: string) {
    return this.request(`/rooms/${id}`, { method: "DELETE" })
  }

  async assignUsersToRoom(roomId: string, userIds: string[]) {
    return this.request(`/rooms/${roomId}/users`, {
      method: "POST",
      body: JSON.stringify({ userIds }),
    })
  }

  async removeUserFromRoom(roomId: string, userId: string) {
    return this.request(`/rooms/${roomId}/users/${userId}`, {
      method: "DELETE",
    })
  }

  // DJ Queue
  async addToDJQueue(data: any) {
    return this.request("/dj-queue", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async removeDJQueueEntry(id: string) {
    return this.request(`/dj-queue/${id}`, { method: "DELETE" })
  }

  // Scenarios
  async executeChatScenario(roomId: string, script: string[]) {
    return this.request("/scenarios/chat", {
      method: "POST",
      body: JSON.stringify({ roomId, script }),
    })
  }

  async executeReactionScenario(roomId: string, assignments: any[]) {
    return this.request("/scenarios/reaction", {
      method: "POST",
      body: JSON.stringify({ roomId, assignments }),
    })
  }

  // Demo API
  async getDemoStatus() {
    return this.request<DemoStatus>("/api/v1/admin/demo/status")
  }

  async initializeDemo(data: DemoInitRequest) {
    return this.request<DemoInitResponse>("/api/v1/admin/demo/init", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getPartyrooms() {
    return this.request<PartyroomsResponse>("/api/v1/admin/demo/partyrooms")
  }

  async startChatSimulation(partyroomId: number, data: ChatSimulationRequest) {
    return this.request<ChatSimulationResponse>(
      `/api/v1/admin/demo/partyrooms/${partyroomId}/chat`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    )
  }

  async stopChatSimulation(partyroomId: number) {
    return this.request<ChatSimulationResponse>(
      `/api/v1/admin/demo/partyrooms/${partyroomId}/chat`,
      {
        method: "DELETE",
      }
    )
  }

  async triggerReactionSimulation(partyroomId: number) {
    return this.request<ReactionSimulationResponse>(
      `/api/v1/admin/demo/partyrooms/${partyroomId}/reactions`,
      {
        method: "POST",
        body: JSON.stringify({}),
      }
    )
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
