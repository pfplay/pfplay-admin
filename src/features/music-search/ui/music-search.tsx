import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useDebounce } from "@/shared/lib/use-debounce"
import { useSearchMusics } from "../api/use-search-musics"
import type { MusicSearchResult } from "../model/music-search-result"
import { SearchInput } from "./search-input"
import { SearchListItem } from "./search-list-item"

interface MusicSearchProps {
  onSelect: (result: MusicSearchResult) => void
}

export function MusicSearch({ onSelect }: MusicSearchProps) {
  const [query, setQuery] = useState("")
  // pfplay-web 과 동일하게 500ms 디바운스 후 쿼리 실행
  const debounced = useDebounce(query, 500)
  const { data: results, isFetching } = useSearchMusics(debounced)

  const hasQuery = debounced.trim().length > 0

  return (
    <div className="space-y-3">
      <SearchInput value={query} onChange={setQuery} />

      <div className="max-h-[340px] space-y-1 overflow-y-auto">
        {isFetching && (
          <div
            className="flex items-center justify-center py-6 text-muted-foreground"
            data-testid="music-search-loading"
          >
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {!isFetching &&
          hasQuery &&
          results?.map((result) => (
            <SearchListItem
              key={result.videoId}
              result={result}
              onSelect={onSelect}
            />
          ))}

        {!isFetching && hasQuery && results?.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            검색 결과가 없습니다.
          </p>
        )}
      </div>
    </div>
  )
}
