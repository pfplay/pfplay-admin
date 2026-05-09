import { useId } from "react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type {
  ReportsListQuery,
  ReportStatus,
  ReportCategory,
  ReportsSort,
} from "../model/filter-schema"

interface Props {
  query: ReportsListQuery
  onChange: (next: Partial<ReportsListQuery>) => void
  onReset: () => void
}

const STATUS_OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: "PENDING", label: "PENDING" },
  { value: "REVIEWING", label: "REVIEWING" },
  { value: "RESOLVED", label: "RESOLVED" },
  { value: "DISMISSED", label: "DISMISSED" },
]

const CATEGORY_OPTIONS: { value: ReportCategory; label: string }[] = [
  { value: "INAPPROPRIATE_CONTENT", label: "부적절 컨텐츠" },
  { value: "HARASSMENT", label: "괴롭힘" },
  { value: "SPAM", label: "스팸" },
  { value: "COPYRIGHT", label: "저작권" },
  { value: "OTHER", label: "기타" },
]

const SORT_OPTIONS: { value: ReportsSort; label: string }[] = [
  { value: "created_at_desc", label: "생성일 ↓" },
  { value: "created_at_asc", label: "생성일 ↑" },
]

function toggle<T>(arr: T[] | undefined, v: T): T[] | undefined {
  const cur = arr ?? []
  const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]
  return next.length === 0 ? undefined : next
}

export function ReportsFilterForm({ query, onChange, onReset }: Props) {
  const fromId = useId()
  const toId = useId()
  const sortId = useId()

  return (
    <div className="space-y-3 mb-4">
      <div className="flex flex-wrap gap-4 items-start">
        <div>
          <p className="text-xs font-medium mb-1">상태</p>
          <div className="flex flex-wrap gap-3">
            {STATUS_OPTIONS.map((o) => {
              const id = `status-${o.value}`
              const checked = (query.status ?? []).includes(o.value)
              return (
                <div key={o.value} className="flex items-center gap-1">
                  <Checkbox
                    id={id}
                    aria-label={`상태 ${o.value}`}
                    checked={checked}
                    onCheckedChange={() =>
                      onChange({ status: toggle(query.status, o.value), page: 0 })
                    }
                  />
                  <Label
                    htmlFor={id}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {o.label}
                  </Label>
                </div>
              )
            })}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium mb-1">카테고리</p>
          <div className="flex flex-wrap gap-3">
            {CATEGORY_OPTIONS.map((o) => {
              const id = `category-${o.value}`
              const checked = (query.category ?? []).includes(o.value)
              return (
                <div key={o.value} className="flex items-center gap-1">
                  <Checkbox
                    id={id}
                    aria-label={`카테고리 ${o.label}`}
                    checked={checked}
                    onCheckedChange={() =>
                      onChange({ category: toggle(query.category, o.value), page: 0 })
                    }
                  />
                  <Label
                    htmlFor={id}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {o.label}
                  </Label>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <Label htmlFor={fromId} className="block text-xs font-medium mb-1">
            시작일
          </Label>
          <Input
            id={fromId}
            type="date"
            value={query.createdFrom ?? ""}
            onChange={(e) =>
              onChange({
                createdFrom: e.target.value || undefined,
                page: 0,
              })
            }
            className="w-40"
          />
        </div>
        <div>
          <Label htmlFor={toId} className="block text-xs font-medium mb-1">
            종료일
          </Label>
          <Input
            id={toId}
            type="date"
            value={query.createdTo ?? ""}
            onChange={(e) =>
              onChange({
                createdTo: e.target.value || undefined,
                page: 0,
              })
            }
            className="w-40"
          />
        </div>
        <div>
          <Label htmlFor={sortId} className="block text-xs font-medium mb-1">
            정렬
          </Label>
          <Select
            value={query.sort}
            onValueChange={(v) => onChange({ sort: v as ReportsSort, page: 0 })}
          >
            <SelectTrigger id={sortId} aria-label="정렬" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={onReset}>
          초기화
        </Button>
      </div>
    </div>
  )
}
