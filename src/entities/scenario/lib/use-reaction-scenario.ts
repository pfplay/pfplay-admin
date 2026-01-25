import { useState, useCallback } from "react"
import type { ReactionAssignment } from "../model/types"
import type { VirtualUser } from "@/entities/user"
import { calculateReactionParticipants, shuffleArray, generateRandomDelay } from "@/shared/lib/utils"

export function useReactionScenario() {
  const [assignments, setAssignments] = useState<ReactionAssignment[]>([])

  const generateAssignments = useCallback((users: VirtualUser[]) => {
    if (users.length === 0) {
      setAssignments([])
      return []
    }

    const { participantCount, likeCount } = calculateReactionParticipants(users.length)

    // 70% 랜덤 선택
    const shuffled = shuffleArray(users)
    const participants = shuffled.slice(0, participantCount)

    // 50/50 분할
    const likeUsers = participants.slice(0, likeCount)
    const grabUsers = participants.slice(likeCount)

    const newAssignments: ReactionAssignment[] = [
      ...likeUsers.map((user) => ({
        userId: user.id,
        username: user.username,
        type: "like" as const,
        delay: generateRandomDelay(1, 15),
      })),
      ...grabUsers.map((user) => ({
        userId: user.id,
        username: user.username,
        type: "grab" as const,
        delay: generateRandomDelay(1, 15),
      })),
    ]

    // delay 순으로 정렬
    newAssignments.sort((a, b) => a.delay - b.delay)
    setAssignments(newAssignments)
    return newAssignments
  }, [])

  const getLikeAssignments = useCallback(() => {
    return assignments.filter((a) => a.type === "like")
  }, [assignments])

  const getGrabAssignments = useCallback(() => {
    return assignments.filter((a) => a.type === "grab")
  }, [assignments])

  const reset = useCallback(() => {
    setAssignments([])
  }, [])

  return {
    assignments,
    generateAssignments,
    getLikeAssignments,
    getGrabAssignments,
    reset,
  }
}
