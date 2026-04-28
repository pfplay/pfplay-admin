import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  page: number // 0-based
  totalPages: number
  totalElements: number
  onChange: (page: number) => void
}

export function Pagination({
  page,
  totalPages,
  totalElements,
  onChange,
}: PaginationProps) {
  if (totalElements === 0) return null
  const canPrev = page > 0
  const canNext = page < totalPages - 1
  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-muted-foreground">총 {totalElements}건</p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!canPrev}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm">
          {page + 1} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!canNext}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
