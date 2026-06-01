import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
}

/**
 * 검색어 입력(controlled). 디바운스는 상위(music-search)에서 useDebounce 로 처리하여
 * 입력 즉각성과 쿼리 호출 빈도를 분리한다. pfplay-web 과 동일하게 500ms 디바운스.
 */
export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="유튜브에서 곡 검색"
        className="pl-8"
        data-testid="music-search-input"
      />
    </div>
  )
}
