import { useParams, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { SongPackBuilder } from "@/features/virtual-dj-song-packs"

export function SongPackDetailPage() {
  const { packId } = useParams<{ packId: string }>()
  const id = Number(packId)
  const idValid = Number.isFinite(id) && id > 0

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <Link
        to="/virtual-dj/song-packs"
        className="inline-block text-sm text-muted-foreground"
      >
        ← 송팩 목록
      </Link>

      {idValid ? (
        <SongPackBuilder packId={id} />
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-muted-foreground">
            존재하지 않는 송팩입니다
          </h2>
          <Button asChild variant="outline">
            <Link to="/virtual-dj/song-packs">목록으로</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
