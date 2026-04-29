import { Button } from "@/components/ui/button"

interface Props {
  selectionSize: number
  onClearSelection: () => void
  onOpenDialog: () => void
}

export function BulkActionToolbar({
  selectionSize,
  onClearSelection,
  onOpenDialog,
}: Props) {
  if (selectionSize === 0) return null
  const overLimit = selectionSize > 100
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div role="status" className="text-sm">
        {overLimit ? (
          <span className="text-destructive">
            선택: {selectionSize}건 — 100건 초과 (100건 이하로 줄여주세요)
          </span>
        ) : (
          <span>선택: {selectionSize}건</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onClearSelection}>
          선택 해제
        </Button>
        <Button size="sm" onClick={onOpenDialog} disabled={overLimit}>
          일괄 처리
        </Button>
      </div>
    </div>
  )
}
