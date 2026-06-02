import { http } from "@/shared/api/http"
import { unwrap } from "@/shared/api/page"
import type { ApiCommonResponse } from "@/shared/api/page"
import type { BotRosterItem } from "@/entities/virtual-dj"

const API = "/api/v1/admin/virtual-dj/bots"

export interface DistributeResult {
  assigned: { userId: number; avatarBodyUri: string }[]
}

export async function getBots(): Promise<BotRosterItem[]> {
  const res = await http<ApiCommonResponse<BotRosterItem[]>>(API)
  return unwrap(res)
}

export async function setBotAvatar(
  userId: number,
  avatarBodyUri: string,
): Promise<void> {
  await http<void>(`${API}/${userId}/avatar`, {
    method: "PUT",
    body: { avatarBodyUri },
  })
}

export async function distributeAvatars(
  botIds: number[],
  bodyUris: string[],
): Promise<DistributeResult> {
  const res = await http<ApiCommonResponse<DistributeResult>>(
    `${API}/avatar/distribute`,
    { method: "POST", body: { botIds, bodyUris } },
  )
  return unwrap(res)
}
