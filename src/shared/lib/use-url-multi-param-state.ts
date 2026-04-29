import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import type { ZodTypeAny, z } from "zod"

/**
 * URL ↔ zod query state — multi-value 키 지원 (`status[]`, `category[]` 등). 14e
 * `ReportsListWidget`의 `urlToQueryObj`/`queryToUrl` 패턴 통합.
 *
 * - `multiKeys`에 명시된 키는 `URLSearchParams.getAll`/`append`로 array 처리
 * - 그 외 키는 `get`/`set`로 scalar 처리
 * - schema 파싱 실패 시 array shape의 부분 invalid는 식별 어려워 14e와 동일하게 전체 reset (toast + replace)
 */
export function useUrlMultiParamState<T extends ZodTypeAny>(
  schema: T,
  multiKeys: readonly string[],
): {
  query: z.infer<T> | null
  setQuery: (next: Partial<z.infer<T>>) => void
  reset: () => void
} {
  const [params, setParams] = useSearchParams()
  const multiSet = new Set(multiKeys)

  const obj: Record<string, unknown> = {}
  const seen = new Set<string>()
  for (const key of params.keys()) {
    if (seen.has(key)) continue
    seen.add(key)
    if (multiSet.has(key)) {
      const values = params.getAll(key)
      if (values.length > 0) obj[key] = values
    } else {
      const v = params.get(key)
      if (v !== null && v !== "") obj[key] = v
    }
  }

  const parsed = schema.safeParse(obj)

  useEffect(() => {
    if (!parsed.success) {
      setParams(new URLSearchParams(), { replace: true })
      toast.error("필터 일부가 잘못돼 무시했어요")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed.success])

  return {
    query: parsed.success ? (parsed.data as z.infer<T>) : null,
    setQuery: (next) => {
      const base = parsed.success ? (parsed.data as Record<string, unknown>) : {}
      const merged: Record<string, unknown> = { ...base, ...next }
      const out = new URLSearchParams()
      for (const [k, v] of Object.entries(merged)) {
        if (v === undefined || v === null) continue
        if (Array.isArray(v)) {
          for (const item of v) {
            if (item === undefined || item === null) continue
            const s = String(item)
            if (s === "") continue
            out.append(k, s)
          }
        } else {
          const s = String(v)
          if (s === "") continue
          out.set(k, s)
        }
      }
      setParams(out)
    },
    reset: () => setParams(new URLSearchParams()),
  }
}
