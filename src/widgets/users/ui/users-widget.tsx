import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsersListTable } from "@/features/users/ui/users-list-table"
import { UserCreateForm } from "@/features/users/ui/user-create-form"
import { BulkActions } from "@/features/users/ui/bulk-actions"

export function UsersWidget() {
  const [activeTab, setActiveTab] = useState("list")

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">가상 유저</h2>
        <p className="text-sm text-muted-foreground mt-2">테스트 및 개발을 위한 시뮬레이션 유저 관리</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3 h-11">
          <TabsTrigger value="list" className="text-sm font-medium">
            유저 목록
          </TabsTrigger>
          <TabsTrigger value="create" className="text-sm font-medium">
            유저 생성
          </TabsTrigger>
          <TabsTrigger value="bulk" className="text-sm font-medium">
            대량 작업
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <UsersListTable />
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <UserCreateForm />
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <BulkActions />
        </TabsContent>
      </Tabs>
    </div>
  )
}
