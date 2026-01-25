// Application Constants

export const APP_NAME = "PFPlay Admin" as const

export const ROUTES = {
  USERS: "/",
  ROOMS: "/rooms",
  SCENARIOS: "/scenarios",
} as const

export const USER_TIERS = {
  FREE: "free",
  PREMIUM: "premium",
  VIP: "vip",
} as const

export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const

export const ROOM_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const

export const REACTION_TYPES = {
  LIKE: "like",
  GRAB: "grab",
} as const

export const SCENARIO_TYPES = {
  CHAT: "chat",
  REACTION: "reaction",
} as const

export const REACTION_CONFIG = {
  PARTICIPANT_RATE: 0.7, // 70%
  LIKE_RATE: 0.5, // 50%
  MIN_DELAY: 1, // seconds
  MAX_DELAY: 15, // seconds
} as const

export const DEFAULT_ROOM_CAPACITY = 20 as const
