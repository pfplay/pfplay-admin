import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, Heart, ThumbsDown, Loader2 } from "lucide-react"
import { useRoomsStore } from "@/entities/room"
import { RoomSelector } from "@/features/rooms/ui/room-selector"
import { apiClient, type ReactionSimulationResponse } from "@/shared/lib/api-client"
import { toast } from "sonner"

export function ReactionScenarioPanel() {
  const { selectedRoomId } = useRoomsStore()
  const [isLoading, setIsLoading] = useState(false)
  const [lastResult, setLastResult] = useState<ReactionSimulationResponse | null>(null)

  const handleTrigger = async () => {
    if (!selectedRoomId) {
      toast.error("파티룸을 선택해주세요")
      return
    }

    setIsLoading(true)
    try {
      const result = await apiClient.triggerReactionSimulation(selectedRoomId)
      setLastResult(result)
      toast.success(`리액션이 발생했습니다 (${result.reactions.length}명)`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "리액션 시뮬레이션에 실패했습니다")
      setLastResult(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>리액션 시나리오</CardTitle>
            <CardDescription>현재 재생 중인 곡에 대해 좋아요/싫어요/그랩 리액션을 발생시킵니다</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <RoomSelector />

        {selectedRoomId && (
          <>
            <div className="rounded-lg bg-accent/30 border border-border p-4 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">시나리오 설명</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>파티룸의 크루들이 현재 재생 중인 곡에 리액션합니다</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>좋아요, 싫어요, 그랩 중 랜덤하게 선택됩니다</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>버튼을 누를 때마다 리액션 이벤트가 발생합니다</span>
                </li>
              </ul>
            </div>

            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handleTrigger}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              리액션 발생
            </Button>

            {lastResult && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">실행 결과</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border p-3 text-center">
                    <Heart className="h-5 w-5 text-pink-500 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-foreground">
                      {lastResult.aggregation.likeCount}
                    </div>
                    <div className="text-xs text-muted-foreground">좋아요</div>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-center">
                    <ThumbsDown className="h-5 w-5 text-red-500 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-foreground">
                      {lastResult.aggregation.dislikeCount}
                    </div>
                    <div className="text-xs text-muted-foreground">싫어요</div>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-center">
                    <Zap className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-foreground">
                      {lastResult.aggregation.grabCount}
                    </div>
                    <div className="text-xs text-muted-foreground">그랩</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
