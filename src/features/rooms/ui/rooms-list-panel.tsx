import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Trash2, Users, Clock } from "lucide-react"
import { useRoomsStore } from "@/entities/room"
import { formatTimestamp } from "@/shared/lib/utils"
import { toast } from "sonner"

export function RoomsListPanel() {
  const { rooms, isLoading, fetchRooms, deleteRoom, selectRoom } = useRoomsStore()
  const [newRoomName, setNewRoomName] = useState("")
  const [newRoomCapacity, setNewRoomCapacity] = useState("20")

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  const handleDelete = async (roomId: string) => {
    if (confirm("정말 이 파티룸을 삭제하시겠습니까?")) {
      await deleteRoom(roomId)
      toast.success("파티룸이 삭제되었습니다")
    }
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoomName.trim()) {
      toast.error("파티룸 이름을 입력해주세요")
      return
    }

    // Create room logic would go here
    toast.success("파티룸이 생성되었습니다")
    setNewRoomName("")
    setNewRoomCapacity("20")
  }

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>활성 파티룸</CardTitle>
              <CardDescription>현재 생성된 파티룸 목록</CardDescription>
            </div>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />새 파티룸 생성
            </Button>
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
                      <Badge variant="outline" className="text-xs">
                        활성
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground mb-2">{room.name}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {room.currentUsers}/{room.maxCapacity} 참가자
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(room.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => selectRoom(room.id)}>
                    관리
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(room.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>새 파티룸 생성</CardTitle>
          <CardDescription>시뮬레이션을 위한 파티룸 생성</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="room-name">파티룸 이름</Label>
                <Input
                  id="room-name"
                  placeholder="테스트 파티룸 1"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-capacity">최대 인원</Label>
                <Input
                  id="max-capacity"
                  type="number"
                  placeholder="20"
                  value={newRoomCapacity}
                  onChange={(e) => setNewRoomCapacity(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setNewRoomName("")
                  setNewRoomCapacity("20")
                }}
              >
                취소
              </Button>
              <Button type="submit">파티룸 생성</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  )
}
