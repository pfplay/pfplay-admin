import { useQuery } from "@tanstack/react-query"
import { getChatConfig } from "./chat-config-api"

export function useChatConfig() {
  return useQuery({
    queryKey: ["virtual-dj", "chat-config"],
    queryFn: getChatConfig,
  })
}
