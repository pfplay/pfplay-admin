import { useMutation, useQueryClient } from "@tanstack/react-query"
import { applyCrewPenalty } from "./partyrooms-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"

export function useExpelCrew() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { partyroomId: number; crewId: number; reason: string }) =>
      applyCrewPenalty(vars.partyroomId, { crewId: vars.crewId, reason: vars.reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partyrooms"] })
      mutationSuccessToast("크루 강퇴 완료")
    },
    onError: mutationErrorToast,
  })
}
