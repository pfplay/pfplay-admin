import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUsersStore, type VirtualUser } from "@/entities/user"
import { toast } from "sonner"

export function UserCreateForm() {
  const { createUser } = useUsersStore()
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    tier: "free" as VirtualUser["tier"],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.username || !formData.email) {
      toast.error("모든 필드를 입력해주세요")
      return
    }

    try {
      await createUser({
        ...formData,
        status: "active",
        isInRoom: false,
        createdAt: new Date(),
        lastActiveAt: new Date(),
      })
      toast.success("가상 유저가 생성되었습니다")
      setFormData({ username: "", email: "", tier: "free" })
    } catch (error) {
      toast.error("유저 생성에 실패했습니다")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>새 가상 유저 생성</CardTitle>
        <CardDescription>테스트를 위한 가상 유저를 생성합니다</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="username">유저명</Label>
              <Input
                id="username"
                placeholder="테스트유저1"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tier">등급</Label>
            <Select
              value={formData.tier}
              onValueChange={(value: VirtualUser["tier"]) => setFormData({ ...formData, tier: value })}
            >
              <SelectTrigger id="tier">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">무료</SelectItem>
                <SelectItem value="premium">프리미엄</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormData({ username: "", email: "", tier: "free" })}
            >
              초기화
            </Button>
            <Button type="submit">유저 생성</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
