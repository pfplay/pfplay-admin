// 백엔드 QueryMusicSearchResponse.MusicData 와 1:1 대응한다.
// (videoId / videoTitle / runningTime / thumbnailUrl — 모두 String)
export interface MusicSearchResult {
  videoId: string
  videoTitle: string
  runningTime: string
  thumbnailUrl: string
}

// 송 팩 트랙 추가 엔드포인트(AddPackTrackRequest)가 기대하는 어휘.
// music-search 응답과 필드명이 다르므로 boundary 매퍼가 반드시 필요하다.
export interface AddTrackInput {
  name: string
  linkId: string
  duration: string
  thumbnailImage: string
}
