import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRoomsStore } from "@/entities/room"
import { RoomSelector } from "./room-selector"

export function UserAssignmentPanel() {
  const { selectedRoomId } = useRoomsStore()

  return (
    <Card>
      <CardHeader>
        <CardTitle>가상 유저 배치</CardTitle>
        <CardDescription>파티룸에 여러 가상 유저를 한번에 입장/퇴장 관리</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RoomSelector />

        {selectedRoomId && (
          <div className="text-center py-8 text-muted-foreground">
            이 기능은 데모 API를 통해 자동으로 관리됩니다.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
