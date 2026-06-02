import { useParams, Navigate } from "react-router-dom"
import { PoolPageContent } from "@/features/virtual-dj-pool"
import { SongPacksPageContent } from "@/features/virtual-dj-song-packs"
import { PersonasPageContent } from "@/features/virtual-dj-personas"

export function VirtualDjPage() {
  const { resourceType } = useParams<{ resourceType: string }>()

  switch (resourceType) {
    case "pool":
      return <PoolPageContent />
    case "song-packs":
      return <SongPacksPageContent />
    case "personas":
      return <PersonasPageContent />
    default:
      return <Navigate to="/virtual-dj/pool" replace />
  }
}
