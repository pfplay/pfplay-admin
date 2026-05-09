/**
 * ISO timestamp 문자열을 KST 로케일 문자열로 변환.
 * null/invalid 입력은 "-"로 fallback.
 *
 * timeZone: "Asia/Seoul" 명시 — OS timezone과 무관하게 항상 KST 출력.
 * 출력에 " KST" suffix 부착 — 운영자가 timezone을 별도 표기 없이 인지.
 */
export function formatKst(iso: string | null): string {
  if (!iso) return "-"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "-"
  const formatted = d.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour12: false,
  })
  return `${formatted} KST`
}
