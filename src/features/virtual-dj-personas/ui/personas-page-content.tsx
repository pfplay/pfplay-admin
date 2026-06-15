import { useState } from "react"
import { Drama, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePersonas } from "../api/use-personas"
import { PersonasList } from "./personas-list"
import { CreatePersonaDialog } from "./create-persona-dialog"
import { EditPersonaDialog } from "./edit-persona-dialog"
import { DeletePersonaDialog } from "./delete-persona-dialog"
import type { PersonaListItem } from "@/entities/virtual-dj"

export function PersonasPageContent() {
  const { data, isLoading, isError } = usePersonas()
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PersonaListItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PersonaListItem | null>(null)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Drama className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold">페르소나</h1>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          페르소나 생성
        </Button>
      </div>

      {isError ? (
        <p className="text-sm text-destructive">
          페르소나 목록을 불러오지 못했습니다.
        </p>
      ) : (
        <PersonasList
          rows={data ?? []}
          isLoading={isLoading}
          isEmpty={!isLoading && (data?.length ?? 0) === 0}
          onEditClick={setEditTarget}
          onDeleteClick={setDeleteTarget}
        />
      )}

      <CreatePersonaDialog open={createOpen} onOpenChange={setCreateOpen} />

      {editTarget && (
        <EditPersonaDialog
          personaId={editTarget.id}
          open={true}
          onOpenChange={(o) => {
            if (!o) setEditTarget(null)
          }}
        />
      )}

      {deleteTarget && (
        <DeletePersonaDialog
          personaId={deleteTarget.id}
          personaName={deleteTarget.name}
          open={true}
          onOpenChange={(o) => {
            if (!o) setDeleteTarget(null)
          }}
        />
      )}
    </div>
  )
}
