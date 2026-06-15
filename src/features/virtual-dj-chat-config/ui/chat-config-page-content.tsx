import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  chatConfigSchema,
  type ChatConfig,
} from "../model/chat-config-schema"
import { useChatConfig } from "../api/use-chat-config"
import { useUpdateChatConfig } from "../api/use-update-chat-config"

export function ChatConfigPageContent() {
  const query = useChatConfig()
  const mutation = useUpdateChatConfig()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ChatConfig>({
    resolver: zodResolver(chatConfigSchema),
    defaultValues: {
      chatEnabled: false,
      selfUpdateEnabled: false,
      probabilityPercent: 0,
      cooldownSeconds: 1,
      contextSize: 1,
      outputMaxTokens: 1,
    },
  })

  // 설정 로딩 완료 시 폼에 기존 값 주입.
  useEffect(() => {
    if (query.data) reset(query.data)
  }, [query.data, reset])

  const chatEnabled = watch("chatEnabled")
  const selfUpdateEnabled = watch("selfUpdateEnabled")

  const onSubmit = (data: ChatConfig) => mutation.mutate(data)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">채팅 설정</h1>
      </div>

      {query.isError ? (
        <p className="text-sm text-destructive">
          채팅 설정을 불러오지 못했습니다.
        </p>
      ) : query.isLoading ? (
        <div className="max-w-xl space-y-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-w-xl space-y-6"
        >
          {/* 봇 채팅 on/off */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="chat-config-chat-enabled"
              checked={chatEnabled}
              onCheckedChange={(c) =>
                setValue("chatEnabled", c === true, { shouldDirty: true })
              }
            />
            <Label
              htmlFor="chat-config-chat-enabled"
              className="cursor-pointer"
            >
              봇 채팅 사용
            </Label>
          </div>

          {/* 자가갱신 모드 (P3-B — 반응 기반 플레이리스트 자가갱신 토글) */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id="chat-config-self-update"
                checked={selfUpdateEnabled}
                onCheckedChange={(c) =>
                  setValue("selfUpdateEnabled", c === true, {
                    shouldDirty: true,
                  })
                }
              />
              <Label
                htmlFor="chat-config-self-update"
                className="cursor-pointer"
              >
                자가갱신 모드
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              켜면 봇이 청취자 반응 기반으로 플레이리스트를 주기적으로 자가갱신합니다 (LLM 선곡).
            </p>
          </div>

          {/* 응답 확률 (%) */}
          <div className="space-y-1">
            <Label htmlFor="chat-config-probability">응답 확률 (%)</Label>
            <Input
              id="chat-config-probability"
              type="number"
              min={0}
              max={100}
              {...register("probabilityPercent", { valueAsNumber: true })}
            />
            {errors.probabilityPercent && (
              <p className="text-sm text-destructive">
                {errors.probabilityPercent.message}
              </p>
            )}
          </div>

          {/* 방 쿨다운 (초) */}
          <div className="space-y-1">
            <Label htmlFor="chat-config-cooldown">방 쿨다운 (초)</Label>
            <Input
              id="chat-config-cooldown"
              type="number"
              min={1}
              {...register("cooldownSeconds", { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground">
              LLM 타임아웃(12초)보다 크게 권장
            </p>
            {errors.cooldownSeconds && (
              <p className="text-sm text-destructive">
                {errors.cooldownSeconds.message}
              </p>
            )}
          </div>

          {/* 맥락 메시지 수 */}
          <div className="space-y-1">
            <Label htmlFor="chat-config-context-size">맥락 메시지 수</Label>
            <Input
              id="chat-config-context-size"
              type="number"
              min={1}
              {...register("contextSize", { valueAsNumber: true })}
            />
            {errors.contextSize && (
              <p className="text-sm text-destructive">
                {errors.contextSize.message}
              </p>
            )}
          </div>

          {/* 응답 max tokens */}
          <div className="space-y-1">
            <Label htmlFor="chat-config-max-tokens">응답 max tokens</Label>
            <Input
              id="chat-config-max-tokens"
              type="number"
              min={1}
              {...register("outputMaxTokens", { valueAsNumber: true })}
            />
            {errors.outputMaxTokens && (
              <p className="text-sm text-destructive">
                {errors.outputMaxTokens.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "처리 중..." : "저장"}
          </Button>
        </form>
      )}
    </div>
  )
}
