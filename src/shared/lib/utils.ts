import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { REACTION_CONFIG } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

export function formatTimestamp(date: Date | string): string {
  return new Date(date).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

export function generateRandomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function calculateReactionParticipants(totalUsers: number) {
  const participantCount = Math.ceil(totalUsers * REACTION_CONFIG.PARTICIPANT_RATE)
  const likeCount = Math.ceil(participantCount * REACTION_CONFIG.LIKE_RATE)

  return {
    participantCount,
    likeCount,
    grabCount: participantCount - likeCount,
  }
}
