import { useParams, Navigate } from "react-router-dom"
import { PoolPageContent } from "@/features/virtual-dj-pool"

function SongPacksPageContent() {
  return (
    <div className="p-6 lg:p-8">
      <h2 className="text-2xl font-bold">송팩</h2>
    </div>
  )
}

export function VirtualDjPage() {
  const { resourceType } = useParams<{ resourceType: string }>()

  switch (resourceType) {
    case "pool":
      return <PoolPageContent />
    case "song-packs":
      return <SongPacksPageContent />
    default:
      return <Navigate to="/virtual-dj/pool" replace />
  }
}
