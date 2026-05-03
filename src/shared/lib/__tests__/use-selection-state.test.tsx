import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useSelectionState } from "../use-selection-state"

describe("useSelectionState", () => {
  it("초기 selectedIds는 빈 Set", () => {
    const { result } = renderHook(() => useSelectionState<number>([]))
    expect(result.current.selectedIds.size).toBe(0)
  })

  it("toggleId: 미포함 → 추가, 포함 → 제거", () => {
    const { result } = renderHook(() => useSelectionState<number>([]))
    act(() => result.current.toggleId(1))
    act(() => result.current.toggleId(2))
    expect(Array.from(result.current.selectedIds)).toEqual([1, 2])
    act(() => result.current.toggleId(1))
    expect(Array.from(result.current.selectedIds)).toEqual([2])
  })

  it("toggleAll(true, visibleIds) → 해당 id만 설정 / (false) → 비움", () => {
    const { result } = renderHook(() => useSelectionState<number>([]))
    act(() => result.current.toggleAll(true, [10, 20, 30]))
    expect(Array.from(result.current.selectedIds).sort()).toEqual([10, 20, 30])
    act(() => result.current.toggleAll(false, []))
    expect(result.current.selectedIds.size).toBe(0)
  })

  it("clearSelection으로 일괄 비움", () => {
    const { result } = renderHook(() => useSelectionState<number>([]))
    act(() => result.current.toggleAll(true, [1, 2, 3]))
    expect(result.current.selectedIds.size).toBe(3)
    act(() => result.current.clearSelection())
    expect(result.current.selectedIds.size).toBe(0)
  })

  it("deps 변경 시 selection 자동 reset (filter/sort 변경 시나리오)", () => {
    const { result, rerender } = renderHook(
      ({ deps }: { deps: unknown[] }) => useSelectionState<number>(deps),
      { initialProps: { deps: ["A", 0] } },
    )
    act(() => result.current.toggleAll(true, [1, 2]))
    expect(result.current.selectedIds.size).toBe(2)
    rerender({ deps: ["B", 0] })
    expect(result.current.selectedIds.size).toBe(0)
  })
})
