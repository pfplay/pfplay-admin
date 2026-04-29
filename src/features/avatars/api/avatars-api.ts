import { http } from "@/shared/api/http"
import { unwrap } from "@/shared/api/page"
import type { ApiCommonResponse } from "@/shared/api/page"
import type {
  AdminAvatarBodyView,
  AdminAvatarFaceView,
} from "@/entities/avatar"
import type { BodyListQuery, FaceListQuery } from "../model/filter-schema"
import type { RetireAvatarRequest } from "../model/retire-schema"

const API = "/api/v1/admin/avatar"

function paramsOf(obj: Record<string, unknown>): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v))
  }
  const qs = p.toString()
  return qs ? `?${qs}` : ""
}

export async function listBodies(
  query: BodyListQuery,
): Promise<AdminAvatarBodyView[]> {
  const res = await http<ApiCommonResponse<AdminAvatarBodyView[]>>(
    `${API}/bodies${paramsOf(query as Record<string, unknown>)}`,
  )
  return unwrap(res)
}

export async function listFaces(
  query: FaceListQuery,
): Promise<AdminAvatarFaceView[]> {
  const res = await http<ApiCommonResponse<AdminAvatarFaceView[]>>(
    `${API}/faces${paramsOf(query as Record<string, unknown>)}`,
  )
  return unwrap(res)
}

export async function getBody(id: number): Promise<AdminAvatarBodyView> {
  const res = await http<ApiCommonResponse<AdminAvatarBodyView>>(
    `${API}/bodies/${id}`,
  )
  return unwrap(res)
}

export async function getFace(id: number): Promise<AdminAvatarFaceView> {
  const res = await http<ApiCommonResponse<AdminAvatarFaceView>>(
    `${API}/faces/${id}`,
  )
  return unwrap(res)
}

export async function publishBody(id: number): Promise<void> {
  await http<void>(`${API}/bodies/${id}/publish`, { method: "POST" })
}

export async function retireBody(
  id: number,
  body: RetireAvatarRequest,
): Promise<void> {
  await http<void>(`${API}/bodies/${id}/retire`, {
    method: "POST",
    body,
  })
}

export async function publishFace(id: number): Promise<void> {
  await http<void>(`${API}/faces/${id}/publish`, { method: "POST" })
}

export async function retireFace(
  id: number,
  body: RetireAvatarRequest,
): Promise<void> {
  await http<void>(`${API}/faces/${id}/retire`, {
    method: "POST",
    body,
  })
}
