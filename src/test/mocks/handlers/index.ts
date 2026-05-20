import { authHandlers } from "./auth"
import { memberHandlers } from "./members"
import { guestHandlers } from "./guests"
import { partyroomHandlers } from "./partyrooms"
import { reportHandlers } from "./reports"
import { avatarHandlers } from "./avatars"
import { administratorHandlers } from "./administrators"
import { announcementHandlers } from "./announcements"

export const handlers = [
  ...authHandlers,
  ...memberHandlers,
  ...guestHandlers,
  ...partyroomHandlers,
  ...reportHandlers,
  ...avatarHandlers,
  ...administratorHandlers,
  ...announcementHandlers,
]
