import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateReportStatus } from "./reports-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"
import type { ReportStatusUpdateRequest } from "../model/transition-schema"
import type { AdminReportDetail, ReportStatus } from "@/entities/report"

const TRANSITION_LABELS: Record<ReportStatus, string> = {
  PENDING: "보류 처리",
  REVIEWING: "검토 시작",
  RESOLVED: "처리 완료",
  DISMISSED: "기각 처리",
}

export function useUpdateReportStatus() {
  const qc = useQueryClient()
  return useMutation<
    AdminReportDetail,
    unknown,
    { reportId: number; body: ReportStatusUpdateRequest }
  >({
    mutationFn: (vars) => updateReportStatus(vars.reportId, vars.body),
    onSuccess: (newDetail, vars) => {
      // PATCH 응답이 detail shape — 즉시 cache 갱신 (refetch 회피)
      qc.setQueryData(["reports", "detail", vars.reportId], newDetail)
      // list cache prefix invalidate (status badge / reviewedBy / resolvedAt 변경 반영)
      qc.invalidateQueries({ queryKey: ["reports", "list"] })
      mutationSuccessToast(TRANSITION_LABELS[newDetail.status] ?? "상태 변경 완료")
    },
    onError: mutationErrorToast,
  })
}
