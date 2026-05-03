import { useQuery } from "@tanstack/react-query"
import { listAdministrators } from "./administrators-api"
import type { AdministratorListQuery } from "../model/filter-schema"

export function useAdministratorsList(query: AdministratorListQuery) {
  return useQuery({
    queryKey: ["administrators", "list", query],
    queryFn: () => listAdministrators(query),
  })
}
