export const CSRF_COOKIE_NAME = "XSRF-TOKEN"
export const CSRF_HEADER = "X-XSRF-TOKEN"

const COOKIE_REGEX = new RegExp(`(?:^|;\\s*)${CSRF_COOKIE_NAME}=([^;]+)`)

export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(COOKIE_REGEX)
  return match ? decodeURIComponent(match[1]) : null
}
