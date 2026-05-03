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
 * @returns query (parsed.success 시 data, 실패 시 null), setQuery (merge + serialize), reset (전부 clear)
 */
export function useUrlQueryState<T extends ZodTypeAny>(schema: T): {
  query: z.infer<T> | null
  setQuery: (next: Partial<z.infer<T>>) => void
  reset: () => void
} {
  const [params, setParams] = useSearchParams()
  const parsed = parseSearchParams(schema, params)

  useEffect(() => {
    if (!parsed.success) {
      const cleaned = stripInvalidParams(params, parsed.error)
      setParams(cleaned, { replace: true })
      toast.error("필터 일부가 잘못돼 무시했어요")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed.success])

  return {
    query: parsed.success ? (parsed.data as z.infer<T>) : null,
    setQuery: (next) => {
      const base = parsed.success ? parsed.data : {}
      const merged = { ...base, ...next }
      setParams(serializeQuery(merged as Record<string, unknown>))
    },
    reset: () => setParams(new URLSearchParams()),
  }
}
