import { useEffect, useId, useState } from "react"
import { Info } from "lucide-react"
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
import type {
  PartyroomsListQuery,
  PartyroomStatus,
  StageType,
  PartyroomSort,
} from "../model/filter-schema"

interface Props {
  query: PartyroomsListQuery
  onChange: (next: Partial<PartyroomsListQuery>) => void
  onReset: () => void
}

const STATUS_OPTIONS: { value: PartyroomStatus; label: string }[] = [
  { value: "ACTIVE", label: "활동 중" },
  { value: "SUSPENDED", label: "일시 중단" },
  { value: "TERMINATED", label: "종료" },
]

const STAGE_OPTIONS: { value: StageType; label: string }[] = [
  { value: "MAIN", label: "MAIN" },
  { value: "GENERAL", label: "GENERAL" },
]

const SORT_OPTIONS: { value: PartyroomSort; label: string }[] = [
  { value: "createdAt,desc", label: "생성일 ↓" },
  { value: "createdAt,asc", label: "생성일 ↑" },
  { value: "lastActivityAt,desc", label: "마지막 활동 ↓" },
  { value: "lastActivityAt,asc", label: "마지막 활동 ↑" },
  { value: "crewCount,desc", label: "크루수 ↓" },
  { value: "crewCount,asc", label: "크루수 ↑" },
  { value: "title,desc", label: "제목 ↓" },
  { value: "title,asc", label: "제목 ↑" },
  { value: "hostNickname,desc", label: "호스트 ↓" },
  { value: "hostNickname,asc", label: "호스트 ↑" },
]

export function PartyroomsFilterForm({ query, onChange, onReset }: Props) {
  const statusId = useId()
  const stageId = useId()
  const hostId = useId()
  const sortId = useId()

  const [hostDraft, setHostDraft] = useState(query.host ?? "")
  // query.host 외부 변경 시 input draft 동기화 (G3.1 polish 교훈 — 초기화 후 입력 잔존 버그 방지)
  useEffect(() => {
    setHostDraft(query.host ?? "")
  }, [query.host])
  const debouncedHost = useDebounce(hostDraft, 300)

  useEffect(() => {
    if (debouncedHost !== (query.host ?? "")) {
      // backend host = email/nickname 부분일치, 2자 미만은 노이즈 → undefined drop
      onChange({
        host:
          debouncedHost && debouncedHost.length >= 2 ? debouncedHost : undefined,
        page: 0,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedHost])

  return (
    <div className="flex flex-wrap gap-2 items-end mb-4">
      <div>
        <label
          htmlFor={statusId}
          className="text-xs font-medium mb-1 flex items-center gap-1"
        >
          상태
          <Info
            className="h-3 w-3 text-muted-foreground"
            aria-label="기본 보기는 종료 룸을 제외합니다. 종료 룸을 보려면 TERMINATED를 선택하세요."
          />
        </label>
        <Select
          value={query.status ?? "ALL"}
          onValueChange={(v) =>
            onChange({
              status: v === "ALL" ? undefined : (v as PartyroomStatus),
              page: 0,
            })
          }
        >
          <SelectTrigger id={statusId} className="w-36" aria-label="상태">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체 (종료 제외)</SelectItem>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label htmlFor={stageId} className="block text-xs font-medium mb-1">
          스테이지
        </label>
        <Select
          value={query.stageType ?? "ALL"}
          onValueChange={(v) =>
            onChange({
              stageType: v === "ALL" ? undefined : (v as StageType),
              page: 0,
            })
          }
        >
          <SelectTrigger id={stageId} className="w-28" aria-label="스테이지">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체</SelectItem>
            {STAGE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label htmlFor={hostId} className="block text-xs font-medium mb-1">
          호스트 (이메일 또는 닉네임)
        </label>
        <Input
          id={hostId}
          value={hostDraft}
          onChange={(e) => setHostDraft(e.target.value)}
          placeholder="2자 이상 부분일치"
          className="w-56"
        />
      </div>
      <div>
        <label htmlFor={sortId} className="block text-xs font-medium mb-1">
          정렬
        </label>
        <Select
          value={query.sort}
          onValueChange={(v) =>
            onChange({ sort: v as PartyroomSort, page: 0 })
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
