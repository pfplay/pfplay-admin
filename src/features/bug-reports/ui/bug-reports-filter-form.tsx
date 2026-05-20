import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { BugReportsListQuery } from "../model/filter-schema"

interface Props {
  query: BugReportsListQuery
  onChange: (next: Partial<BugReportsListQuery>) => void
  onReset: () => void
}

export function BugReportsFilterForm({ query, onChange, onReset }: Props) {
  return (
    <div className="flex flex-wrap gap-3 items-end mb-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">기간 시작</label>
        <Input
          type="datetime-local"
          value={query.createdFrom ?? ""}
          onChange={(e) =>
            onChange({ createdFrom: e.target.value || undefined, page: 0 })
          }
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">기간 종료</label>
        <Input
          type="datetime-local"
          value={query.createdTo ?? ""}
          onChange={(e) =>
            onChange({ createdTo: e.target.value || undefined, page: 0 })
          }
        />
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
        <label className="text-xs text-muted-foreground">본문 키워드</label>
        <Input
          type="text"
          value={query.contentKeyword ?? ""}
          onChange={(e) =>
            onChange({ contentKeyword: e.target.value || undefined, page: 0 })
          }
          placeholder="키워드"
        />
      </div>
      <Button variant="outline" onClick={onReset} type="button">
        초기화
      </Button>
    </div>
  )
}
