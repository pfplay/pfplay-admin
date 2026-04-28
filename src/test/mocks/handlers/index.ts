import { authHandlers } from "./auth"
import { memberHandlers } from "./members"
import { partyroomHandlers } from "./partyrooms"

export const handlers = [...authHandlers, ...memberHandlers, ...partyroomHandlers]
