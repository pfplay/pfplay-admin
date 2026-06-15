import { Music, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SongPackTrack } from "@/entities/virtual-dj"

interface Props {
  tracks: SongPackTrack[]
  onRemove: (trackId: number) => void
}

export function TrackList({ tracks, onRemove }: Props) {
  if (tracks.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
        아직 곡이 없습니다
      </div>
    )
  }

  return (
    <ul className="space-y-1">
      {tracks.map((track) => (
        <li
          key={track.trackId}
          className="flex items-center gap-3 rounded-md border px-2 py-2"
        >
          {track.thumbnailImage ? (
            <img
              src={track.thumbnailImage}
              alt=""
              width={60}
              height={34}
              className="h-[34px] w-[60px] shrink-0 rounded object-cover"
            />
          ) : (
            <div className="flex h-[34px] w-[60px] shrink-0 items-center justify-center rounded bg-muted">
              <Music className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <span className="min-w-0 flex-1 truncate text-left text-sm">
            {track.name}
          </span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {track.duration}
          </span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0"
            onClick={() => onRemove(track.trackId)}
            aria-label={`트랙 ${track.name} 제거`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </li>
      ))}
    </ul>
  )
}
