import { useId } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import type { AdministratorListQuery } from "../model/filter-schema"
import type { AdminRole } from "@/entities/administrator"

interface Props {
  query: AdministratorListQuery
  onChange: (next: Partial<AdministratorListQuery>) => void
  onReset: () => void
}

const ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: "SUPER_ADMIN", label: "슈퍼어드민" },
  { value: "ADMIN", label: "어드민" },
]

export function AdministratorsFilterForm({ query, onChange, onReset }: Props) {
  const roleId = useId()
  const includeRevokedId = useId()

  return (
    <div className="flex flex-wrap gap-2 items-end mb-4">
      <div>
        <label htmlFor={roleId} className="block text-xs font-medium mb-1">
          역할
        </label>
        <Select
          value={query.role ?? "ALL"}
          onValueChange={(v) =>
            onChange({ role: v === "ALL" ? undefined : (v as AdminRole) })
          }
        >
          <SelectTrigger id={roleId} className="w-36" aria-label="역할">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체</SelectItem>
            {ROLE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2 h-9">
        <Checkbox
          id={includeRevokedId}
          checked={query.includeRevoked === true}
          onCheckedChange={(c) =>
            onChange({ includeRevoked: c === true ? true : undefined })
          }
          aria-label="회수된 어드민 포함"
        />
        <label
          htmlFor={includeRevokedId}
          className="text-sm font-normal cursor-pointer"
        >
          회수된 어드민 포함
        </label>
      </div>
      <Button variant="outline" onClick={onReset}>
        초기화
      </Button>
    </div>
  )
}
