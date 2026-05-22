import { useEffect, useId, useState } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useDebounce } from "@/shared/lib/use-debounce"
import type { GuestsListQuery, GuestSort } from "../model/filter-schema"

interface Props {
  query: GuestsListQuery
  onChange: (next: Partial<GuestsListQuery>) => void
  onReset: () => void
}

const SORT_OPTIONS: { value: GuestSort; label: string }[] = [
  { value: "created_at_desc", label: "가입일 ↓" },
  { value: "created_at_asc", label: "가입일 ↑" },
  { value: "last_activity_desc", label: "마지막 활동 ↓" },
]

export function GuestsFilterForm({ query, onChange, onReset }: Props) {
  const emailId = useId()
  const fromId = useId()
  const toId = useId()
  const sortId = useId()

  const [emailDraft, setEmailDraft] = useState(query.email ?? "")
  useEffect(() => {
    setEmailDraft(query.email ?? "")
  }, [query.email])
  const debouncedEmail = useDebounce(emailDraft, 300)

  useEffect(() => {
    if (debouncedEmail !== (query.email ?? "")) {
      onChange({ email: debouncedEmail || undefined, page: 0 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedEmail])

  return (
    <div className="flex flex-wrap gap-2 items-end mb-4">
      <div>
        <label htmlFor={emailId} className="block text-xs font-medium mb-1">
          이메일
        </label>
        <Input
          id={emailId}
          value={emailDraft}
          onChange={(e) => setEmailDraft(e.target.value)}
          placeholder="부분일치"
          className="w-48"
        />
      </div>
      <div>
        <label htmlFor={fromId} className="block text-xs font-medium mb-1">
          가입일 from
        </label>
        <Input
          id={fromId}
          type="date"
          value={query.joined_from ?? ""}
          onChange={(e) =>
            onChange({ joined_from: e.target.value || undefined, page: 0 })
          }
          className="w-36"
        />
      </div>
      <div>
        <label htmlFor={toId} className="block text-xs font-medium mb-1">
          가입일 to
        </label>
        <Input
          id={toId}
          type="date"
          value={query.joined_to ?? ""}
          onChange={(e) =>
            onChange({ joined_to: e.target.value || undefined, page: 0 })
          }
          className="w-36"
        />
      </div>
      <div>
        <label htmlFor={sortId} className="block text-xs font-medium mb-1">
          정렬
        </label>
        <Select
          value={query.sort}
          onValueChange={(v) =>
            onChange({ sort: v as GuestSort, page: 0 })
          }
        >
          <SelectTrigger id={sortId} className="w-44" aria-label="정렬">
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
  )
}
