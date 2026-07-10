import { useQuery } from "@tanstack/react-query"
import { getAvatarCatalog } from "./avatar-catalog-api"

export function useAvatarCatalog() {
  return useQuery({
    queryKey: ["virtual-crew", "avatar-catalog"],
    queryFn: getAvatarCatalog,
    // 카탈로그는 정적(published 바디 셋) — 잦은 재요청 불필요
    staleTime: 1000 * 60 * 30,
  })
}
