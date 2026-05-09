import { describe, it, expect, vi } from "vitest"
import { renderHook } from "@testing-library/react"
import { useDialogResetEffect } from "../use-dialog-reset-effect"

describe("useDialogResetEffect", () => {
  it("open=true → onReset 호출 안 함", () => {
    const onReset = vi.fn()
    renderHook(() => useDialogResetEffect(true, onReset))
    expect(onReset).not.toHaveBeenCalled()
  })

  it("open=false → onReset 즉시 호출", () => {
    const onReset = vi.fn()
    renderHook(() => useDialogResetEffect(false, onReset))
    expect(onReset).toHaveBeenCalledOnce()
  })

  it("open true → false 전환 시 onReset 호출", () => {
    const onReset = vi.fn()
    const { rerender } = renderHook(
      ({ open }: { open: boolean }) => useDialogResetEffect(open, onReset),
      { initialProps: { open: true } },
    )
    expect(onReset).not.toHaveBeenCalled()
    rerender({ open: false })
    expect(onReset).toHaveBeenCalledOnce()
  })
})
