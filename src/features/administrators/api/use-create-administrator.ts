import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createAdministrator } from "./administrators-api"
import { mutationErrorToast } from "@/shared/lib/mutation-toast"
import type { CreateAdministratorRequest } from "../model/mutation-schema"

// success toast는 별도 처리 — tempPassword 노출 다이얼로그가 자체 UI를 갖기 때문에 generic
// success toast 띄우지 않음 (mutation 사용처에서 직접 결과 분기).
export function useCreateAdministrator() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateAdministratorRequest) => createAdministrator(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["administrators"] })
    },
    onError: mutationErrorToast,
  })
}
