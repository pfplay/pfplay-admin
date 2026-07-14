import { http } from "@/shared/api/http"
import { unwrap } from "@/shared/api/page"
import type { ApiCommonResponse } from "@/shared/api/page"
import type { BotRosterItem } from "@/entities/virtual-crew"

const API = "/api/v1/admin/virtual-crew/bots"

export interface DistributeResult {
  assigned: { userId: number; avatarBodyUri: string }[]
}

export interface PersonaApplyResult {
  applied: number
}

export interface RemoveBotsResult {
  removed: number
  removedUserIds: number[]
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

export async function renameBot(
  userId: number,
  nickname: string,
): Promise<void> {
  await http<void>(`${API}/${userId}/nickname`, {
    method: "PUT",
    body: { nickname },
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

export async function assignPersona(
  botIds: number[],
  personaId: number,
): Promise<PersonaApplyResult> {
  const res = await http<ApiCommonResponse<PersonaApplyResult>>(
    `${API}/persona/assign`,
    { method: "POST", body: { botIds, personaId } },
  )
  return unwrap(res)
}

export async function unassignPersona(
  botIds: number[],
): Promise<PersonaApplyResult> {
  const res = await http<ApiCommonResponse<PersonaApplyResult>>(
    `${API}/persona/unassign`,
    { method: "POST", body: { botIds } },
  )
  return unwrap(res)
}

export async function removeBots(
  botUserIds: number[],
): Promise<RemoveBotsResult> {
  const res = await http<ApiCommonResponse<RemoveBotsResult>>(`${API}/remove`, {
    method: "POST",
    body: { botUserIds },
  })
  return unwrap(res)
}
