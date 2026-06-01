import type { AddTrackInput, MusicSearchResult } from "./music-search-result"

/**
 * music-search 결과 → 송 팩 트랙 추가 입력 boundary 매퍼.
 *
 * 두 DTO 는 어휘가 다르다(videoTitle↔name, videoId↔linkId, runningTime↔duration,
 * thumbnailUrl↔thumbnailImage). spread/as-cast 는 컴파일은 되지만 빈 필드를 만들어내므로
 * 절대 사용하지 않고 필드별 명시 매핑을 한다.
 */
export function toPackTrack(m: MusicSearchResult): AddTrackInput {
  return {
    name: m.videoTitle,
    linkId: m.videoId,
    duration: m.runningTime,
    thumbnailImage: m.thumbnailUrl,
  }
}
