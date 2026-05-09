import type { ZodError, ZodTypeAny } from "zod"

export function parseSearchParams<T extends ZodTypeAny>(
  schema: T,
  params: URLSearchParams,
): ReturnType<T["safeParse"]> {
  const obj = Object.fromEntries(params.entries())
  return schema.safeParse(obj) as ReturnType<T["safeParse"]>
}

export function stripInvalidParams(
  params: URLSearchParams,
  error: ZodError,
): URLSearchParams {
  const invalidKeys = new Set<string>()
  for (const issue of error.issues) {
    const key = issue.path[0]
    if (typeof key === "string") invalidKeys.add(key)
  }
  const cleaned = new URLSearchParams(params)
  for (const k of invalidKeys) cleaned.delete(k)
  return cleaned
}

export function serializeQuery(query: Record<string, unknown>): URLSearchParams {
  const out = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue
    const s = String(v)
    if (s === "") continue
    out.set(k, s)
  }
  return out
}
