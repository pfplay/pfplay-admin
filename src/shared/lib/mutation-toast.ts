import { toast } from "sonner"
import { ApiError } from "@/shared/api/error"

export function mutationSuccessToast(message: string): void {
  toast.success(message)
}

export function mutationErrorToast(err: unknown): void {
  if (err instanceof ApiError) {
    toast.error(err.message ?? "요청 실패", {
      description: `code: ${err.errorCode ?? "UNKNOWN"} (status: ${err.status})`,
    })
  } else {
    toast.error("요청 실패")
  }
}
