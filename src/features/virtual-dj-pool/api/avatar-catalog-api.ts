import { http } from "@/shared/api/http"
import { unwrap } from "@/shared/api/page"
import type { ApiCommonResponse } from "@/shared/api/page"
import type { AvatarCatalogItem } from "@/entities/virtual-dj"

const API = "/api/v1/admin/virtual-dj/avatar-catalog"

export async function getAvatarCatalog(): Promise<AvatarCatalogItem[]> {
  const res = await http<ApiCommonResponse<AvatarCatalogItem[]>>(API)
  return unwrap(res)
}
