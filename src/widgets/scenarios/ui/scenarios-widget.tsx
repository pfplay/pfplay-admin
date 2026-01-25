import { useState } from "react"
import { RotateCcw, CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ChatScenarioPanel } from "@/features/scenarios/ui/chat-scenario-panel"
import { ReactionScenarioPanel } from "@/features/scenarios/ui/reaction-scenario-panel"
import { apiClient, type DemoStatus } from "@/shared/lib/api-client"
import { useRoomsStore } from "@/entities/room"

export function ScenariosWidget() {
  const [activeTab, setActiveTab] = useState("chat")
  const [demoStatus, setDemoStatus] = useState<DemoStatus | null>(null)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { fetchRooms } = useRoomsStore()

  const handleCheckStatus = async () => {
    setIsCheckingStatus(true)
    setError(null)
    try {
      const status = await apiClient.getDemoStatus()
      setDemoStatus(status)
    } catch (err) {
      setError(err instanceof Error ? err.message : "상태 확인 실패")
      setDemoStatus(null)
    } finally {
      setIsCheckingStatus(false)
    }
  }

  const handleResetDemo = async () => {
    setIsInitializing(true)
    setError(null)
    try {
      await apiClient.initializeDemo({
        playbackTimeLimit: 300,
        titlePrefix: "Demo Room",
        introduction: "Demo environment for preview and testing",
        registerDjs: true,
      })
      // 초기화 후 상태 및 파티룸 목록 다시 조회
      const status = await apiClient.getDemoStatus()
      setDemoStatus(status)
      await fetchRooms()
    } catch (err) {
      setError(err instanceof Error ? err.message : "초기화 실패")
    } finally {
      setIsInitializing(false)
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">시나리오</h2>
          <p className="text-sm text-muted-foreground mt-2">채팅 및 리액션 시나리오 실행</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCheckStatus} disabled={isCheckingStatus}>
            {isCheckingStatus ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            상태 확인
          </Button>
          <Button variant="destructive" onClick={handleResetDemo} disabled={isInitializing}>
            {isInitializing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            데모 환경 초기화
          </Button>
        </div>
      </div>

      {/* 상태 표시 영역 */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {demoStatus && (
        <div className="mb-6 p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                demoStatus.initialized ? "bg-green-500" : "bg-yellow-500"
              }`}
            />
            <span className="font-medium text-foreground">
              {demoStatus.initialized ? "초기화됨" : "초기화 필요"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">가상 멤버 수:</span>{" "}
              <span className="font-medium text-foreground">{demoStatus.virtualMemberCount}</span>
            </div>
            <div>
              <span className="text-muted-foreground">일반 파티룸 수:</span>{" "}
              <span className="font-medium text-foreground">{demoStatus.generalRoomCount}</span>
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-2 h-11">
          <TabsTrigger value="chat" className="text-sm font-medium">
            채팅 시나리오
          </TabsTrigger>
          <TabsTrigger value="reaction" className="text-sm font-medium">
            리액션 시나리오
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <ChatScenarioPanel />
        </TabsContent>

        <TabsContent value="reaction" className="space-y-4">
          <ReactionScenarioPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
