import { useState } from "react"
import { ListMusic, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSongPacks } from "../api/use-song-packs"
import { SongPacksList } from "./song-packs-list"
import { CreateSongPackDialog } from "./create-song-pack-dialog"
import { RenameSongPackDialog } from "./rename-song-pack-dialog"
import { DeleteSongPackDialog } from "./delete-song-pack-dialog"
import type { SongPackListItem } from "@/entities/virtual-dj"

export function SongPacksPageContent() {
  const { data, isLoading, isError } = useSongPacks()
  const [createOpen, setCreateOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<SongPackListItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SongPackListItem | null>(null)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ListMusic className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold">송팩</h1>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          송팩 생성
        </Button>
      </div>

      {isError ? (
        <p className="text-sm text-destructive">송팩 목록을 불러오지 못했습니다.</p>
      ) : (
        <SongPacksList
          rows={data ?? []}
          isLoading={isLoading}
          isEmpty={!isLoading && (data?.length ?? 0) === 0}
          onRenameClick={setRenameTarget}
          onDeleteClick={setDeleteTarget}
        />
      )}

      <CreateSongPackDialog open={createOpen} onOpenChange={setCreateOpen} />

      {renameTarget && (
        <RenameSongPackDialog
          packId={renameTarget.id}
          currentName={renameTarget.name}
          open={true}
          onOpenChange={(o) => {
            if (!o) setRenameTarget(null)
          }}
        />
      )}

      {deleteTarget && (
        <DeleteSongPackDialog
          packId={deleteTarget.id}
          packName={deleteTarget.name}
          open={true}
          onOpenChange={(o) => {
            if (!o) setDeleteTarget(null)
          }}
        />
      )}
    </div>
  )
}
