import { useEffect, useState } from "react"

/**
 * 선택 상태(Set<T>) 관리 + deps 변경 시 자동 reset. 14d `partyrooms-list` widget의
 * `useState<Set<T>> + useEffect query reset + toggleId/toggleAll/clear` 패턴 통합.
 *
 * @param deps query/filter 등 selection을 무효화해야 하는 의존성 배열 (filter/sort/page 등)
 */
export function useSelectionState<T>(deps: unknown[]): {
  selectedIds: Set<T>
  toggleId: (id: T) => void
  toggleAll: (checked: boolean, visibleIds: T[]) => void
  clearSelection: () => void
} {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set())

  useEffect(() => {
    setSelectedIds(new Set())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return {
    selectedIds,
    toggleId: (id) =>
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      }),
    toggleAll: (checked, visibleIds) =>
      setSelectedIds(checked ? new Set(visibleIds) : new Set()),
    clearSelection: () => setSelectedIds(new Set()),
  }
}
