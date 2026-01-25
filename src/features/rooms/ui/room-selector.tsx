import { useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useRoomsStore } from "@/entities/room"

interface RoomSelectorProps {
  label?: string
  placeholder?: string
}

export function RoomSelector({
  label = "대상 파티룸",
  placeholder = "파티룸을 선택하세요",
}: RoomSelectorProps) {
  const { rooms, selectedRoomId, selectRoom, fetchRooms, isLoading } = useRoomsStore()

  useEffect(() => {
    if (rooms.length === 0) {
      fetchRooms()
    }
  }, [rooms.length, fetchRooms])

  return (
    <div className="space-y-2">
      <Label htmlFor="room-selector">{label}</Label>
      <Select
        value={selectedRoomId?.toString() || ""}
        onValueChange={(value) => selectRoom(Number(value))}
        disabled={isLoading}
      >
        <SelectTrigger id="room-selector">
          <SelectValue placeholder={isLoading ? "로딩 중..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {rooms.map((room) => (
            <SelectItem key={room.id} value={room.id.toString()}>
              <div className="flex items-center gap-2">
                <Badge variant={room.stageType === "MAIN" ? "default" : "secondary"} className="text-xs">
                  {room.stageType}
                </Badge>
                <span>{room.name}</span>
                <span className="text-muted-foreground">- {room.crewCount}명</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
