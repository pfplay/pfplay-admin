import { useId } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type {
  BodyListQuery,
  FaceListQuery,
} from "../model/filter-schema"
import type {
  LifecycleStatus,
  ObtainmentType,
  AvatarResourceType,
} from "@/entities/avatar"

const LIFECYCLE_OPTIONS: { value: LifecycleStatus; label: string }[] = [
  { value: "DRAFT", label: "DRAFT" },
  { value: "PUBLISHED", label: "PUBLISHED" },
  { value: "RETIRED", label: "RETIRED" },
]

const OBTAINMENT_OPTIONS: { value: ObtainmentType; label: string }[] = [
  { value: "BASIC", label: "BASIC" },
  { value: "DJ_PNT", label: "DJ_PNT" },
  { value: "REF_LINK", label: "REF_LINK" },
  { value: "ROOM_ACT", label: "ROOM_ACT" },
]

interface Props {
  resourceType: AvatarResourceType
  query: BodyListQuery | FaceListQuery
  onChange: (next: Partial<BodyListQuery & FaceListQuery>) => void
  onReset: () => void
}

export function AvatarsFilterForm({ resourceType, query, onChange, onReset }: Props) {
  const statusId = useId()
  const typeId = useId()

  return (
    <div className="flex flex-wrap gap-2 items-end mb-4">
      <div>
        <Label htmlFor={statusId} className="block text-xs font-medium mb-1">
          상태
        </Label>
        <Select
          value={query.status ?? "ALL"}
          onValueChange={(v) =>
            onChange({
              status: v === "ALL" ? undefined : (v as LifecycleStatus),
            })
          }
        >
          <SelectTrigger id={statusId} aria-label="상태" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체</SelectItem>
            {LIFECYCLE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {resourceType === "body" && (
        <div>
          <Label htmlFor={typeId} className="block text-xs font-medium mb-1">
            획득
          </Label>
          <Select
            value={(query as BodyListQuery).obtainableType ?? "ALL"}
            onValueChange={(v) =>
              onChange({
                obtainableType:
                  v === "ALL" ? undefined : (v as ObtainmentType),
              })
            }
          >
            <SelectTrigger id={typeId} aria-label="획득" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체</SelectItem>
              {OBTAINMENT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <Button variant="outline" onClick={onReset}>
        초기화
      </Button>
    </div>
  )
}
