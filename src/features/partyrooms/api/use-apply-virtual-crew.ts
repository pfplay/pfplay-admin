import { useMutation, useQueryClient } from "@tanstack/react-query"
import { applyConfig } from "./virtual-crew-room-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"
import type { VirtualCrewConfigRequest } from "../model/virtual-crew-config-schema"

export function useApplyVirtualCrew(partyroomId: number) {
  const qc = useQueryClient()
  return useMutation<void, unknown, VirtualCrewConfigRequest>({
    mutationFn: (body) => applyConfig(partyroomId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["virtual-crew", "room", partyroomId] })
      qc.invalidateQueries({ queryKey: ["partyrooms"] })
      mutationSuccessToast("가상 DJ 설정 적용 완료")
    },
    onError: mutationErrorToast,
  })
}
