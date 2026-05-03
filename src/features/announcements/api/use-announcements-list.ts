import { useQuery } from "@tanstack/react-query"
import { listAnnouncements } from "./announcements-api"
import type { AnnouncementListQuery } from "../model/filter-schema"

export function useAnnouncementsList(query: AnnouncementListQuery) {
  return useQuery({
    queryKey: ["announcements", "list", query],
    queryFn: () => listAnnouncements(query),
  })
}
