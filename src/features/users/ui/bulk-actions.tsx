import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUsersStore } from "@/entities/user"
import { toast } from "sonner"
import { Upload, Plus } from "lucide-react"

export function BulkActions() {
  const { createUser } = useUsersStore()
  const [count, setCount] = useState("10")
  const [jsonData, setJsonData] = useState("")

  const handleBulkCreate = async () => {
    const num = Number.parseInt(count)
    if (isNaN(num) || num < 1 || num > 100) {
      toast.error("1-100 사이의 숫자를 입력하세요")
      return
    }

    for (let i = 0; i < num; i++) {
      await createUser({
        username: `자동생성유저${Date.now()}_${i}`,
        email: `auto${Date.now()}_${i}@test.com`,
        tier: ["free", "premium", "vip"][i % 3] as any,
        status: "active",
        isInRoom: false,
        createdAt: new Date(),
        lastActiveAt: new Date(),
      })
    }

    toast.success(`${num}명의 유저가 생성되었습니다`)
  }

  const handleJsonImport = async () => {
    try {
      const users = JSON.parse(jsonData)
      if (!Array.isArray(users)) {
        toast.error("배열 형식의 JSON이 필요합니다")
        return
      }

      for (const user of users) {
        await createUser(user)
      }

      toast.success(`${users.length}명의 유저가 가져오기되었습니다`)
      setJsonData("")
    } catch (error) {
      toast.error("잘못된 JSON 형식입니다")
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>대량 생성</CardTitle>
          <CardDescription>여러 가상 유저를 한번에 생성합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-count">생성할 유저 수</Label>
              <Input
                id="bulk-count"
                type="number"
                min="1"
                max="100"
                placeholder="10"
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">최대 100명까지 생성 가능합니다</p>
            </div>
            <Button onClick={handleBulkCreate} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              {count}명 생성
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>JSON 가져오기</CardTitle>
          <CardDescription>JSON 형식으로 유저 데이터를 가져옵니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="json-import">JSON 데이터</Label>
              <Textarea
                id="json-import"
                placeholder='[{"username":"테스트1","email":"test1@test.com","tier":"free"}]'
                className="min-h-[200px] font-mono text-xs"
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
              />
            </div>
            <Button onClick={handleJsonImport} variant="secondary" className="w-full gap-2">
              <Upload className="h-4 w-4" />
              JSON 가져오기
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
