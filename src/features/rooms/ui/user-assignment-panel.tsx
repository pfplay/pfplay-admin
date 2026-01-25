import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Users, UserPlus } from "lucide-react"
import { useUsersStore } from "@/entities/user"
import { useRoomsStore } from "@/entities/room"
import { RoomSelector } from "./room-selector"
import { toast } from "sonner"

export function UserAssignmentPanel() {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const { users, getAvailableUsers, getUsersInRoom } = useUsersStore()
  const { selectedRoomId, assignUsers, removeUser } = useRoomsStore()

  const availableUsers = useMemo(() => getAvailableUsers(), [getAvailableUsers, users])
  const roomUsers = useMemo(() => {
    if (!selectedRoomId) return []
    return getUsersInRoom(selectedRoomId)
  }, [selectedRoomId, getUsersInRoom, users])

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const toggleAllUsers = () => {
    const allIds = availableUsers.map((u) => u.id)
    setSelectedUserIds((prev) => (prev.length === allIds.length ? [] : allIds))
  }

  const handleAssignUsers = async () => {
    if (!selectedRoomId) {
      toast.error("파티룸을 선택해주세요")
      return
    }

    if (selectedUserIds.length === 0) {
      toast.error("입장시킬 유저를 선택해주세요")
      return
    }

    try {
      await assignUsers(selectedRoomId, selectedUserIds)
      toast.success(`${selectedUserIds.length}명의 유저가 입장했습니다`)
      setSelectedUserIds([])
    } catch (error) {
      toast.error("유저 입장에 실패했습니다")
    }
  }

  const handleRemoveUser = async (userId: string) => {
    if (!selectedRoomId) return

    try {
      await removeUser(selectedRoomId, userId)
      toast.success("유저가 퇴장했습니다")
    } catch (error) {
      toast.error("유저 퇴장에 실패했습니다")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>가상 유저 배치</CardTitle>
        <CardDescription>파티룸에 여러 가상 유저를 한번에 입장/퇴장 관리</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RoomSelector />

        {selectedRoomId && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-base font-semibold">유저 입장시키기</Label>
                </div>
                <Button variant="ghost" size="sm" onClick={toggleAllUsers}>
                  {selectedUserIds.length === availableUsers.length ? "전체 해제" : "전체 선택"}
                </Button>
              </div>

              <div className="rounded-lg border border-border divide-y divide-border max-h-96 overflow-y-auto">
                {availableUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 hover:bg-accent/5 transition-colors">
                    <Checkbox
                      checked={selectedUserIds.includes(user.id)}
                      onCheckedChange={() => toggleUserSelection(user.id)}
                      id={`user-${user.id}`}
                    />
                    <label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer text-sm font-medium">
                      {user.username}
                    </label>
                  </div>
                ))}
              </div>

              {selectedUserIds.length > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="text-sm font-medium">
                    <span className="text-primary">{selectedUserIds.length}명</span>의 유저 선택됨
                  </span>
                  <Button size="sm" className="gap-2" onClick={handleAssignUsers}>
                    <UserPlus className="h-4 w-4" />
                    선택한 유저 입장시키기
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">현재 입장한 유저 ({roomUsers.length}명)</Label>
              <div className="rounded-lg border border-border">
                {roomUsers.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">입장한 유저가 없습니다</div>
                ) : (
                  roomUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{user.username}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemoveUser(user.id)}
                      >
                        퇴장
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
