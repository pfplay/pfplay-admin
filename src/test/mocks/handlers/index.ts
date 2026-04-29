import { authHandlers } from "./auth"
import { memberHandlers } from "./members"
import { partyroomHandlers } from "./partyrooms"
import { reportHandlers } from "./reports"
import { avatarHandlers } from "./avatars"

export const handlers = [
  ...authHandlers,
  ...memberHandlers,
  ...partyroomHandlers,
  ...reportHandlers,
  ...avatarHandlers,
]
