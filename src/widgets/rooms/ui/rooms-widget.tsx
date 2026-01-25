import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RoomsListPanel } from "@/features/rooms/ui/rooms-list-panel"
import { UserAssignmentPanel } from "@/features/rooms/ui/user-assignment-panel"
import { DJQueuePanel } from "@/features/rooms/ui/dj-queue-panel"

export function RoomsWidget() {
  const [activeTab, setActiveTab] = useState("list")

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">파티룸</h2>
        <p className="text-sm text-muted-foreground mt-2">파티룸 관리 및 가상 유저 배치</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3 h-11">
          <TabsTrigger value="list" className="text-sm font-medium">
            파티룸 목록
          </TabsTrigger>
          <TabsTrigger value="users" className="text-sm font-medium">
            유저 배치
          </TabsTrigger>
          <TabsTrigger value="dj" className="text-sm font-medium">
            DJ 대기열
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <RoomsListPanel />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserAssignmentPanel />
        </TabsContent>

        <TabsContent value="dj" className="space-y-4">
          <DJQueuePanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
