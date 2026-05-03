import { useMutation, useQueryClient } from "@tanstack/react-query"
import { resetAdministratorPassword } from "./administrators-api"
import { mutationErrorToast } from "@/shared/lib/mutation-toast"

// success toast는 별도 — tempPassword 노출 다이얼로그가 자체 UI를 가짐 (use-create-administrator와 동일 패턴).
export function useResetAdministratorPassword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => resetAdministratorPassword(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["administrators"] })
    },
    onError: mutationErrorToast,
  })
}
