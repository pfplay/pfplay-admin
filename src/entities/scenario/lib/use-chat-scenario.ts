import { useState, useCallback } from "react"
import type { ChatAssignment } from "../model/types"
import type { VirtualUser } from "@/entities/user"

export function useChatScenario() {
  const [script, setScript] = useState("")
  const [assignments, setAssignments] = useState<ChatAssignment[]>([])

  const analyzeScript = useCallback((scriptText: string, users: VirtualUser[]) => {
    const lines = scriptText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    if (lines.length === 0 || users.length === 0) {
      setAssignments([])
      return []
    }

    const newAssignments: ChatAssignment[] = lines.map((line, index) => {
      const user = users[index % users.length]
      return {
        userId: user.id,
        username: user.username,
        message: line,
        order: index + 1,
      }
    })

    setAssignments(newAssignments)
    return newAssignments
  }, [])

  const reset = useCallback(() => {
    setScript("")
    setAssignments([])
  }, [])

  return {
    script,
    setScript,
    assignments,
    analyzeScript,
    reset,
  }
}
