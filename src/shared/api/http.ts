import { ApiError } from "./error"
import { CSRF_HEADER, getCsrfToken } from "./csrf"
import { API_BASE_URL } from "../config/env"
import { useSessionStore } from "../../entities/session/model/store"

export interface HttpOptions extends Omit<RequestInit, "body"> {
  body?: unknown
  /** Skip 401 → store.clear + redirect. Used by login (no session yet) */
  skip401Redirect?: boolean
}

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

export async function http<T = unknown>(path: string, opts: HttpOptions = {}): Promise<T> {
  const { body, skip401Redirect, headers, method = "GET", ...rest } = opts

  const finalHeaders = new Headers(headers)
  if (body !== undefined) {
    finalHeaders.set("Content-Type", "application/json")
  }

  // CSRF echo for unsafe methods
  if (UNSAFE_METHODS.has(method.toUpperCase())) {
    const token = getCsrfToken()
    if (token) finalHeaders.set(CSRF_HEADER, token)
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    method,
    headers: finalHeaders,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && !skip401Redirect) {
    useSessionStore.getState().clear()
    window.location.href = "/login"
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({
      status: res.status,
      errorCode: "UNKNOWN",
      message: res.statusText,
    }))
    throw new ApiError(
      errBody.status ?? res.status,
      errBody.errorCode ?? "UNKNOWN",
      errBody.message ?? "Request failed",
    )
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
