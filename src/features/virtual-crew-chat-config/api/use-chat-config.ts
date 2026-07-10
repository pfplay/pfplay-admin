import { useQuery } from "@tanstack/react-query"
import { getChatConfig } from "./chat-config-api"

export function useChatConfig() {
  return useQuery({
    queryKey: ["virtual-crew", "chat-config"],
    queryFn: getChatConfig,
  })
}
