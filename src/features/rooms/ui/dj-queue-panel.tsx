import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Music, Trash2 } from "lucide-react"
import { useUsersStore } from "@/entities/user"
import { useRoomsStore } from "@/entities/room"
import { RoomSelector } from "./room-selector"
import { toast } from "sonner"

// Mock data for playlists
const PLAYLISTS = [
  {
    id: "playlist1",
    name: "K-POP 인기곡",
    tracks: [
      { id: "track1", title: "Super Shy", artist: "NewJeans" },
      { id: "track2", title: "Perfect Night", artist: "LE SSERAFIM" },
      { id: "track3", title: "Love Lee", artist: "AKMU" },
    ],
  },
  {
    id: "playlist2",
    name: "팝 명곡 모음",
    tracks: [
      { id: "track4", title: "Anti-Hero", artist: "Taylor Swift" },
      { id: "track5", title: "flowers", artist: "Miley Cyrus" },
    ],
  },
  {
    id: "playlist3",
    name: "EDM 파티",
    tracks: [
      { id: "track6", title: "Titanium", artist: "David Guetta" },
      { id: "track7", title: "Wake Me Up", artist: "Avicii" },
    ],
  },
]

export function DJQueuePanel() {
  const { getUsersInRoom } = useUsersStore()
  const { selectedRoomId } = useRoomsStore()
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("")
  const [selectedTrackId, setSelectedTrackId] = useState<string>("")

  const roomUsers = useMemo(() => {
    if (!selectedRoomId) return []
    return getUsersInRoom(selectedRoomId)
  }, [selectedRoomId, getUsersInRoom])

  const selectedPlaylist = PLAYLISTS.find((p) => p.id === selectedPlaylistId)

  const handleAddToDJQueue = () => {
    if (!selectedUserId || !selectedPlaylistId || !selectedTrackId) {
      toast.error("모든 항목을 선택해주세요")
      return
    }

    // Add to DJ queue logic
    toast.success("DJ 대기열에 등록되었습니다")
    setSelectedUserId("")
    setSelectedPlaylistId("")
    setSelectedTrackId("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>DJ 대기열 관리</CardTitle>
        <CardDescription>가상 유저를 DJ로 등록하고 플레이리스트 선택</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RoomSelector />

        {selectedRoomId && (
          <>
            <div className="rounded-lg border border-border p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-muted-foreground" />
                <Label className="text-base font-semibold">DJ 등록</Label>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dj-user">가상 유저 선택</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger id="dj-user">
                      <SelectValue placeholder="DJ로 등록할 유저 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="playlist">플레이리스트 선택</Label>
                  <Select
                    value={selectedPlaylistId}
                    onValueChange={(value) => {
                      setSelectedPlaylistId(value)
                      setSelectedTrackId("")
                    }}
                  >
                    <SelectTrigger id="playlist">
                      <SelectValue placeholder="플레이리스트를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAYLISTS.map((playlist) => (
                        <SelectItem key={playlist.id} value={playlist.id}>
                          {playlist.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="track">트랙 선택</Label>
                  <Select value={selectedTrackId} onValueChange={setSelectedTrackId} disabled={!selectedPlaylistId}>
                    <SelectTrigger id="track">
                      <SelectValue
                        placeholder={selectedPlaylistId ? "트랙을 선택하세요" : "먼저 플레이리스트를 선택하세요"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedPlaylist?.tracks.map((track) => (
                        <SelectItem key={track.id} value={track.id}>
                          {track.title} - {track.artist}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full gap-2" onClick={handleAddToDJQueue}>
                  <Music className="h-4 w-4" />
                  DJ 대기열에 등록
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">현재 DJ 대기열</Label>
              <div className="rounded-lg border border-border divide-y divide-border">
                {[
                  { id: 1, username: "테스트유저1", playlist: "K-POP 인기곡", track: "Super Shy" },
                  { id: 2, username: "테스트유저2", playlist: "EDM 파티", track: "Titanium" },
                ].map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Music className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.playlist} - {item.track}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
