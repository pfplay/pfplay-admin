import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { MusicSearchResult } from "../model/music-search-result"

interface SearchListItemProps {
  result: MusicSearchResult
  onSelect: (result: MusicSearchResult) => void
}

export function SearchListItem({ result, onSelect }: SearchListItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50">
      <img
        src={result.thumbnailUrl}
        alt="썸네일"
        width={60}
        height={34}
        className="h-[34px] w-[60px] shrink-0 rounded object-cover"
      />
      {/* 일본어/중국어 등 정상 렌더링을 위해 title 은 decode 한다 */}
      <span className="min-w-0 flex-1 truncate text-left text-sm">
        {safeDecodeURI(result.videoTitle)}
      </span>
      <span
        className="shrink-0 text-xs tabular-nums text-muted-foreground"
        data-testid="track-duration"
      >
        {formatDuration(result.runningTime)}
      </span>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-7 w-7 shrink-0"
        onClick={() => onSelect(result)}
        aria-label="트랙 추가"
        data-testid="track-select-button"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}

/** URL 인코딩된 제목을 안전하게 디코드 (malformed 입력은 원문 유지) */
function safeDecodeURI(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/** 'm:ss' / 'h:mm:ss' 형태를 zero-pad 하여 정규화 */
function formatDuration(duration: string): string {
  const parts = duration.split(":")
  if (parts.length <= 1) return duration
  return parts.map((p) => p.padStart(2, "0")).join(":")
}
