import { useParams, Navigate } from "react-router-dom"
import { PoolPageContent } from "@/features/virtual-crew-pool"
import { SongPacksPageContent } from "@/features/virtual-crew-song-packs"
import { PersonasPageContent } from "@/features/virtual-crew-personas"
import { ChatConfigPageContent } from "@/features/virtual-crew-chat-config"

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
    default:
      return <Navigate to="/virtual-crew/pool" replace />
  }
}
