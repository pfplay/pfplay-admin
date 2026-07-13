import { useParams, Navigate } from "react-router-dom"
import { PoolPageContent } from "@/features/virtual-crew-pool"
import { SongPacksPageContent } from "@/features/virtual-crew-song-packs"
import { PersonasPageContent } from "@/features/virtual-crew-personas"
import { ChatConfigPageContent } from "@/features/virtual-crew-chat-config"
import { CrewRoomsPageContent } from "@/features/virtual-crew-rooms"

export function VirtualCrewPage() {
  const { resourceType } = useParams<{ resourceType: string }>()

  switch (resourceType) {
    case "pool":
      return <PoolPageContent />
    case "song-packs":
      return <SongPacksPageContent />
    case "personas":
      return <PersonasPageContent />
    case "chat-config":
      return <ChatConfigPageContent />
    case "rooms":
      return <CrewRoomsPageContent />
    default:
      // 알 수 없는 하위 → 허브로.
      return <Navigate to="/virtual-crew" replace />
  }
}
