import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { MessageSquare, Play, Square, Loader2 } from "lucide-react"
import { useRoomsStore } from "@/entities/room"
import { RoomSelector } from "@/features/rooms/ui/room-selector"
import { apiClient } from "@/shared/lib/api-client"
import { toast } from "sonner"

type ScriptType = "CHILL" | "HYPE"

export function ChatScenarioPanel() {
  const { selectedRoomId } = useRoomsStore()
  const [scriptType, setScriptType] = useState<ScriptType>("CHILL")
  const [isRunning, setIsRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleStart = async () => {
    if (!selectedRoomId) {
      toast.error("파티룸을 선택해주세요")
      return
    }

    setIsLoading(true)
    try {
      await apiClient.startChatSimulation(selectedRoomId, { scriptType })
      setIsRunning(true)
      toast.success("채팅 시뮬레이션이 시작되었습니다")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "시뮬레이션 시작에 실패했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStop = async () => {
    if (!selectedRoomId) return

    setIsLoading(true)
    try {
      await apiClient.stopChatSimulation(selectedRoomId)
      setIsRunning(false)
      toast.success("채팅 시뮬레이션이 중지되었습니다")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "시뮬레이션 중지에 실패했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>채팅 시나리오</CardTitle>
            <CardDescription>선택한 분위기에 맞는 채팅을 자동으로 생성합니다</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <RoomSelector />

        {selectedRoomId && (
          <>
            <div className="space-y-3">
              <Label>스크립트 타입</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setScriptType("CHILL")}
                  disabled={isRunning}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    scriptType === "CHILL"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="font-semibold text-foreground mb-1">CHILL</div>
                  <div className="text-sm text-muted-foreground">편안한 분위기의 대화</div>
                </button>
                <button
                  type="button"
                  onClick={() => setScriptType("HYPE")}
                  disabled={isRunning}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    scriptType === "HYPE"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="font-semibold text-foreground mb-1">HYPE</div>
                  <div className="text-sm text-muted-foreground">고에너지 파티 분위기</div>
                </button>
              </div>
            </div>

            {isRunning ? (
              <Button
                className="w-full gap-2"
                size="lg"
                variant="destructive"
                onClick={handleStop}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                시뮬레이션 중지
              </Button>
            ) : (
              <Button
                className="w-full gap-2"
                size="lg"
                onClick={handleStart}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                시뮬레이션 시작
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
