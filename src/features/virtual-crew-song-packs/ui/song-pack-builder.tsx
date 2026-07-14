import { MusicSearch, toPackTrack } from "@/features/music-search"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/shared/api/error"
import { useSongPackDetail } from "../api/use-song-pack-detail"
import { useAddTrack } from "../api/use-add-track"
import { useRemoveTrack } from "../api/use-remove-track"
import { TrackList } from "./track-list"

interface Props {
  packId: number
}

export function SongPackBuilder({ packId }: Props) {
  const { data, isLoading, error } = useSongPackDetail(packId)
  const addTrack = useAddTrack(packId)
  const removeTrack = useRemoveTrack(packId)

  if (error instanceof ApiError && error.status === 404) {
    return (
      <p className="text-sm text-muted-foreground">존재하지 않는 송팩입니다</p>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">송팩을 불러오지 못했습니다.</p>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{data.name}</h1>
        {data.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {data.description}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>트랙 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <TrackList
              tracks={data.tracks}
              onRemove={(trackId) => removeTrack.mutate(trackId)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>곡 추가</CardTitle>
          </CardHeader>
          <CardContent>
            <MusicSearch
              onSelect={(result) => addTrack.mutate(toPackTrack(result))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
