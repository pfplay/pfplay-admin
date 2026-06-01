import { useMutation, useQueryClient } from "@tanstack/react-query"
import { provisionPool } from "./pool-api"
import { mutationErrorToast } from "@/shared/lib/mutation-toast"

export function useProvisionPool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (count: number) => provisionPool(count),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["virtual-dj", "pool"] })
    },
    onError: mutationErrorToast,
  })
}
