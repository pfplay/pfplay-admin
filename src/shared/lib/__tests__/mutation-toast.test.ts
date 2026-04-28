import { describe, expect, it, vi, beforeEach } from "vitest"
import { toast } from "sonner"
import { ApiError } from "@/shared/api/error"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"

describe("mutation-toast", () => {
  beforeEach(() => {
    vi.spyOn(toast, "success").mockImplementation(() => "")
    vi.spyOn(toast, "error").mockImplementation(() => "")
  })

  it("mutationSuccessToast calls toast.success with message", () => {
    mutationSuccessToast("등급 변경 완료")
    expect(toast.success).toHaveBeenCalledWith("등급 변경 완료")
  })

  it("mutationErrorToast surfaces ApiError errorCode + status", () => {
    const err = new ApiError(403, "ALREADY_TERMINATED", "이미 종료됨")
    mutationErrorToast(err)
    expect(toast.error).toHaveBeenCalledWith("이미 종료됨", {
      description: "code: ALREADY_TERMINATED (status: 403)",
    })
  })

  it("mutationErrorToast falls back to generic for non-ApiError", () => {
    mutationErrorToast(new Error("network down"))
    expect(toast.error).toHaveBeenCalledWith("요청 실패")
  })
})
