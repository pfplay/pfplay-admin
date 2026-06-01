import { useParams } from "react-router-dom"

export function SongPackDetailPage() {
  const { packId } = useParams<{ packId: string }>()

  return (
    <div className="p-6 lg:p-8">
      <h2 className="text-2xl font-bold">송팩 상세</h2>
      <p className="text-sm text-muted-foreground">송팩 #{packId}</p>
    </div>
  )
}
