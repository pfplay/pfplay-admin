import { useEffect } from "react"

/**
 * 모달 close 시 form/mutation reset 콜백 호출. 14c R11 폴리시 일관 — 14c~14f의 8 dialog
 * inline `useEffect(() => { if (!open) { ...reset; mutation.reset() } }, [open])`
 * 패턴을 단일 helper로 통합.
 *
 * @param open Dialog open 상태
 * @param onReset open=false 진입 시 호출되는 cleanup 함수 (form reset / mutation.reset 등)
 */
export function useDialogResetEffect(open: boolean, onReset: () => void): void {
  useEffect(() => {
    if (!open) onReset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
}
