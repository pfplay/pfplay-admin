import { useMutation, useQueryClient } from "@tanstack/react-query"
import { applyConfig } from "./virtual-dj-room-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"
import type { VirtualDjConfigRequest } from "../model/virtual-dj-config-schema"

export function useApplyVirtualDj(partyroomId: number) {
  const qc = useQueryClient()
  return useMutation<void, unknown, VirtualDjConfigRequest>({
    mutationFn: (body) => applyConfig(partyroomId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["virtual-dj", "room", partyroomId] })
      qc.invalidateQueries({ queryKey: ["partyrooms"] })
      mutationSuccessToast("가상 DJ 설정 적용 완료")
    },
    onError: mutationErrorToast,
  })
}
