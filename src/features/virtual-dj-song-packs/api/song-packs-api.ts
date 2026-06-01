import { http } from "@/shared/api/http"
import { unwrap } from "@/shared/api/page"
import type { ApiCommonResponse } from "@/shared/api/page"
import type { SongPackListItem, SongPackDetail } from "@/entities/virtual-dj"
import type {
  CreateSongPackRequest,
  RenameSongPackRequest,
  AddTrackRequest,
} from "../model/song-pack-schema"

const API = "/api/v1/admin/virtual-dj/song-packs"

interface CreatedIdResponse {
  id: number
}

export async function listSongPacks(): Promise<SongPackListItem[]> {
  const res = await http<ApiCommonResponse<SongPackListItem[]>>(API)
  return unwrap(res)
}

export async function getSongPack(id: number): Promise<SongPackDetail> {
  const res = await http<ApiCommonResponse<SongPackDetail>>(`${API}/${id}`)
  return unwrap(res)
}

export async function createSongPack(
  body: CreateSongPackRequest,
): Promise<number> {
  const res = await http<ApiCommonResponse<CreatedIdResponse>>(API, {
    method: "POST",
    body,
  })
  return unwrap(res).id
}

export async function renameSongPack(
  id: number,
  body: RenameSongPackRequest,
): Promise<void> {
  await http<void>(`${API}/${id}`, { method: "PUT", body })
}

export async function deleteSongPack(id: number): Promise<void> {
  await http<void>(`${API}/${id}`, { method: "DELETE" })
}

export async function addTrack(
  packId: number,
  body: AddTrackRequest,
): Promise<number> {
  const res = await http<ApiCommonResponse<CreatedIdResponse>>(
    `${API}/${packId}/tracks`,
    { method: "POST", body },
  )
  return unwrap(res).id
}

export async function removeTrack(
  packId: number,
  trackId: number,
): Promise<void> {
  await http<void>(`${API}/${packId}/tracks/${trackId}`, { method: "DELETE" })
}
