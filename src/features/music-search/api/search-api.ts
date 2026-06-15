import { http } from "@/shared/api/http"
import { unwrap } from "@/shared/api/page"
import type { ApiCommonResponse } from "@/shared/api/page"
import type { MusicSearchResult } from "../model/music-search-result"

const API = "/api/v1/admin/virtual-dj/music-search"

interface MusicSearchEnvelope {
  musicList: MusicSearchResult[]
}

export async function searchMusics(q: string): Promise<MusicSearchResult[]> {
  const res = await http<ApiCommonResponse<MusicSearchEnvelope>>(
    `${API}?q=${encodeURIComponent(q)}`,
  )
  return unwrap(res).musicList
}
