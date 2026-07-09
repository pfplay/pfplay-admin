import type { AvatarCatalogItem } from "@/entities/virtual-crew"

/**
 * 아바타 피커 옵션 UI 표현.
 * - value: 선택 식별자(= bodyUri, 셋팅/배분 API 가 받는 키)
 * - label: 표시 이름
 * - thumbnail: 썸네일 URI
 * - combinable: face 합성형(true) vs standalone(false) 배지 구분
 * - tier: 획득 타입(BASIC 등, 없으면 null)
 */
export interface AvatarOption {
  value: string
  label: string
  thumbnail: string
  combinable: boolean
  tier: string | null
}

/**
 * 카탈로그 DTO → 피커 옵션 boundary 매퍼.
 *
 * 두 모델은 어휘가 다르다(bodyUri↔value, name↔label, thumbnailUri↔thumbnail,
 * obtainableType↔tier). spread/as-cast 는 source 어휘를 누수시키므로 절대 쓰지 않고
 * 필드별 명시 매핑한다.
 */
export function toAvatarOption(c: AvatarCatalogItem): AvatarOption {
  return {
    value: c.bodyUri,
    label: c.name,
    thumbnail: c.thumbnailUri,
    combinable: c.combinable,
    tier: c.obtainableType,
  }
}
