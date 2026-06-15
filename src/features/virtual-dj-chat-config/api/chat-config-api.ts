import { http } from "@/shared/api/http"
import { unwrap } from "@/shared/api/page"
import type { ApiCommonResponse } from "@/shared/api/page"
import type { ChatConfig } from "../model/chat-config-schema"

const API = "/api/v1/admin/virtual-dj/chat-config"

export async function getChatConfig(): Promise<ChatConfig> {
  const res = await http<ApiCommonResponse<ChatConfig>>(API)
  return unwrap(res)
}

export async function updateChatConfig(payload: ChatConfig): Promise<void> {
  await http<void>(API, { method: "PUT", body: payload })
}
