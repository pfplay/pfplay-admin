import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Music } from "lucide-react"
import { useRoomsStore } from "@/entities/room"
import { RoomSelector } from "./room-selector"

export function DJQueuePanel() {
  const { selectedRoomId } = useRoomsStore()

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
                <Label className="text-base font-semibold">DJ 대기열</Label>
              </div>
              <div className="text-center py-8 text-muted-foreground">
                이 기능은 데모 API를 통해 자동으로 관리됩니다.
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
