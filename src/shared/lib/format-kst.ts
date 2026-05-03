/**
 * ISO timestamp 문자열을 KST 로케일 문자열로 변환.
 * null/invalid 입력은 "-"로 fallback.
 *
 * 14b G9: members-table / member-detail-cards / partyroom-detail-cards 3곳에
 * byte-identical 사본이 존재했던 것을 본 위치로 추출. spec §14 entry 14/20.
 */
export function formatKst(iso: string | null): string {
  if (!iso) return "-"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleString("ko-KR", { hour12: false })
}
