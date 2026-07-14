import { useMutation, useQueryClient } from "@tanstack/react-query"
import { provisionPool } from "./pool-api"
import { mutationErrorToast } from "@/shared/lib/mutation-toast"

export function useProvisionPool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (count: number) => provisionPool(count),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["virtual-crew", "pool"] })
      // provision 은 새 봇 계정을 만든다 — 같은 페이지의 봇 로스터도 갱신해야 즉시 반영된다.
      qc.invalidateQueries({ queryKey: ["virtual-crew", "bots"] })
    },
    onError: mutationErrorToast,
  })
}
