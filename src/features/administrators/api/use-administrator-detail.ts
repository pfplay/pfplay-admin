import { useQuery } from "@tanstack/react-query"
import { findAdministratorByIdFromList } from "./administrators-api"

// backend가 detail endpoint를 제공하지 않아 list 응답에서 추출. 운영 어드민 수십 명 가정이라
// 매 detail page 진입 시 list refetch도 가벼움. 추후 backend가 detail endpoint 신설하면 swap.
export function useAdministratorDetail(id: number) {
  return useQuery({
    queryKey: ["administrators", "detail", id],
    queryFn: () => findAdministratorByIdFromList(id),
    enabled: id > 0,
  })
}
