import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Users } from "lucide-react"
import { useRoomsStore } from "@/entities/room"

export function RoomsListPanel() {
  const { rooms, isLoading, fetchRooms, selectRoom } = useRoomsStore()

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>활성 파티룸</CardTitle>
            <CardDescription>현재 생성된 파티룸 목록</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="파티룸 ID, 이름으로 검색..." className="pl-9" />
          </div>
        </div>
        <div className="space-y-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-medium">{room.id}</span>
                    <Badge variant={room.stageType === "MAIN" ? "default" : "secondary"} className="text-xs">
                      {room.stageType}
                    </Badge>
                    {room.isPlaybackActivated && (
                      <Badge variant="outline" className="text-xs text-green-600">
                        재생 중
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground mb-2">{room.name}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {room.crewCount}명 참가 중
                    </span>
                    <span>DJ {room.djCount}명</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => selectRoom(room.id)}>
                  선택
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
