export interface ChatScriptLine {
  message: string
  order: number
}

export interface ChatAssignment {
  userId: string
  username: string
  message: string
  order: number
}

export type ReactionType = "like" | "grab"

export interface ReactionAssignment {
  userId: string
  username: string
  type: ReactionType
  delay: number
}

export interface ScenarioExecution {
  id: string
  roomId: string
  type: "chat" | "reaction"
  status: "pending" | "running" | "completed" | "failed"
  createdAt: Date
  completedAt?: Date
}
