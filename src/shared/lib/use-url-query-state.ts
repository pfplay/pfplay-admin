import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import type { ZodTypeAny, z } from "zod"
import {
  parseSearchParams,
  stripInvalidParams,
  serializeQuery,
} from "@/shared/lib/url-state"

/**
 * URL ↔ zod query state 단일 hook. invalid params는 toast + drop. 14b/14c members/partyrooms
 * widget의 inline `parseSearchParams + stripInvalidParams + setParams` 패턴 통합.
 *
 * @param options.preserveExternalKeys — schema 에 없는 URL 키 중 setQuery/reset 시 보존할 키 목록.
 *   탭 컨테이너의 `tab` 같은 외부 상태가 widget 의 schema 와 무관하게 URL 에 공존할 때 사용.
 *   옵션 미사용 호출처(기존 partyrooms/reports 등)는 동작 동일.
 *
 * @returns query (parsed.success 시 data, 실패 시 null), setQuery (merge + serialize), reset (전부 clear)
 */
export function useUrlQueryState<T extends ZodTypeAny>(
  schema: T,
  options?: { preserveExternalKeys?: string[] },
): {
  query: z.infer<T> | null
  setQuery: (next: Partial<z.infer<T>>) => void
  reset: () => void
} {
  const [params, setParams] = useSearchParams()
  const parsed = parseSearchParams(schema, params)
  const preserveKeys = options?.preserveExternalKeys ?? []

  useEffect(() => {
    if (!parsed.success) {
      const cleaned = stripInvalidParams(params, parsed.error)
      setParams(cleaned, { replace: true })
      toast.error("필터 일부가 잘못돼 무시했어요")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed.success])

  const buildOutWithPreserved = (base: URLSearchParams): URLSearchParams => {
    for (const key of preserveKeys) {
      const existing = params.get(key)
      if (existing !== null) base.set(key, existing)
    }
    return base
  }

  return {
    query: parsed.success ? (parsed.data as z.infer<T>) : null,
    setQuery: (next) => {
      const base = parsed.success ? parsed.data : {}
      const merged = { ...base, ...next }
      const out = serializeQuery(merged as Record<string, unknown>)
      setParams(buildOutWithPreserved(out))
    },
    reset: () => setParams(buildOutWithPreserved(new URLSearchParams())),
  }
}
