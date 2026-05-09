/**
 * RHF v7 + zodResolver에서 zod schema의 top-level `.refine()` 에러는 `errors[""]` 빈 키에
 * 매핑됨. type narrowing이 어려운 cast 1줄을 helper로 추출 (14c UpdateMetaDialog 패턴).
 *
 * @param errors RHF `formState.errors`
 * @returns 빈 키에 매핑된 refine 에러 (없으면 undefined)
 */
export function useRefineError(
  errors: Record<string, unknown>,
): { message?: string; type?: string } | undefined {
  return (errors as Record<string, { message?: string; type?: string } | undefined>)[""]
}
