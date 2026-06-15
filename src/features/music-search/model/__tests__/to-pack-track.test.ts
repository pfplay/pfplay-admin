import { describe, it, expect } from "vitest"
import { toPackTrack } from "../to-pack-track"
import type { MusicSearchResult } from "../music-search-result"

describe("toPackTrack — boundary 매퍼", () => {
  const sample: MusicSearchResult = {
    videoId: "dQw4w9WgXcQ",
    videoTitle: "Rick Astley - Never Gonna Give You Up",
    runningTime: "3:33",
    thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg",
  }

  it("각 필드를 올바른 대상 필드로 매핑한다", () => {
    const out = toPackTrack(sample)
    expect(out.name).toBe("Rick Astley - Never Gonna Give You Up")
    expect(out.linkId).toBe("dQw4w9WgXcQ")
    expect(out.duration).toBe("3:33")
    expect(out.thumbnailImage).toBe("https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg")
  })

  it("어떤 대상 필드도 빈 값/undefined 가 아니다 (매퍼 존재 이유)", () => {
    const out = toPackTrack(sample)
    for (const key of ["name", "linkId", "duration", "thumbnailImage"] as const) {
      expect(out[key]).toBeTruthy()
      expect(out[key]).not.toBe("")
      expect(out[key]).not.toBeUndefined()
    }
  })

  it("source 의 videoTitle/videoId 어휘를 그대로 흘려보내지 않는다", () => {
    const out = toPackTrack(sample) as unknown as Record<string, unknown>
    // 결과 객체에는 source 어휘 키가 없어야 한다 (spread 회귀 방지)
    expect(out.videoTitle).toBeUndefined()
    expect(out.videoId).toBeUndefined()
    expect(out.runningTime).toBeUndefined()
    expect(out.thumbnailUrl).toBeUndefined()
  })
})
