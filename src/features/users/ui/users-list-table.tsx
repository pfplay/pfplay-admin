import { useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Clock } from "lucide-react"
import { useUsersStore, type VirtualUser } from "@/entities/user"
import { formatTimestamp } from "@/shared/lib/utils"

const TIER_LABELS: Record<VirtualUser["tier"], string> = {
  free: "무료",
  premium: "프리미엄",
  vip: "VIP",
}

const TIER_VARIANTS: Record<VirtualUser["tier"], "secondary" | "default" | "outline"> = {
  free: "secondary",
  premium: "default",
  vip: "outline",
}

export function UsersListTable() {
  const { users, isLoading, fetchUsers, deleteUser } = useUsersStore()

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleDelete = async (userId: string) => {
    if (confirm("정말 이 유저를 삭제하시겠습니까?")) {
      await deleteUser(userId)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">유저명</TableHead>
            <TableHead className="font-semibold">이메일</TableHead>
            <TableHead className="font-semibold">등급</TableHead>
            <TableHead className="font-semibold">상태</TableHead>
            <TableHead className="font-semibold">파티룸</TableHead>
            <TableHead className="font-semibold">생성일</TableHead>
            <TableHead className="text-right font-semibold">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-accent/5">
              <TableCell className="font-medium">{user.username}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                <Badge variant={TIER_VARIANTS[user.tier]} className="text-xs">
                  {TIER_LABELS[user.tier]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.status === "active" ? "default" : "secondary"} className="text-xs">
                  {user.status === "active" ? "활성" : "비활성"}
                </Badge>
              </TableCell>
              <TableCell>
                {user.isInRoom ? (
                  <Badge variant="outline" className="text-xs">
                    {user.currentRoomId}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">미입장</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimestamp(user.createdAt)}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
