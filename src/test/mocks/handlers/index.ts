import { authHandlers } from "./auth"
import { memberHandlers } from "./members"
import { partyroomHandlers } from "./partyrooms"
import { reportHandlers } from "./reports"

export const handlers = [
  ...authHandlers,
  ...memberHandlers,
  ...partyroomHandlers,
  ...reportHandlers,
]
