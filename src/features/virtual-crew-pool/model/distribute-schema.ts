import { z } from "zod"

/**
 * 봇 아바타 일괄 배분 요청 검증.
 * - botIds: 선택된 봇 1명 이상
 * - bodyUris: 배분 셋(아바타) 1개 이상
 * backend DistributeBotAvatarRequest(@NotEmpty botIds, @NotEmpty bodyUris) 와 정렬.
 */
export const distributeAvatarsSchema = z.object({
  // botIds 는 TSID 문자열(2^53 초과 → JS number 정밀도 손실 방지). 비어있지 않은 문자열만 허용.
  botIds: z
    .array(z.string().min(1))
    .min(1, "봇을 1명 이상 선택하세요"),
  bodyUris: z.array(z.string()).min(1, "아바타를 1개 이상 선택하세요"),
})

export type DistributeAvatarsRequest = z.infer<typeof distributeAvatarsSchema>
