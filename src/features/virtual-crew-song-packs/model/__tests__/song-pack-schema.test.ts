import { describe, it, expect } from "vitest"
import {
  createSongPackSchema,
  renameSongPackSchema,
  addTrackSchema,
} from "../song-pack-schema"

describe("createSongPackSchema", () => {
  it("name 1자 통과 / description 생략 통과", () => {
    expect(createSongPackSchema.safeParse({ name: "a" }).success).toBe(true)
  })

  it("name 빈 문자열 실패", () => {
    expect(createSongPackSchema.safeParse({ name: "" }).success).toBe(false)
  })

  it("name 100자 통과 / 101자 실패", () => {
    expect(
      createSongPackSchema.safeParse({ name: "n".repeat(100) }).success,
    ).toBe(true)
    expect(
      createSongPackSchema.safeParse({ name: "n".repeat(101) }).success,
    ).toBe(false)
  })

  it("description 500자 통과 / 501자 실패 / null 통과", () => {
    expect(
      createSongPackSchema.safeParse({ name: "a", description: "d".repeat(500) })
        .success,
    ).toBe(true)
    expect(
      createSongPackSchema.safeParse({ name: "a", description: "d".repeat(501) })
        .success,
    ).toBe(false)
    expect(
      createSongPackSchema.safeParse({ name: "a", description: null }).success,
    ).toBe(true)
  })
})

describe("renameSongPackSchema", () => {
  it("name 1자 통과 / 빈 문자열 실패 / 101자 실패", () => {
    expect(renameSongPackSchema.safeParse({ name: "a" }).success).toBe(true)
    expect(renameSongPackSchema.safeParse({ name: "" }).success).toBe(false)
    expect(
      renameSongPackSchema.safeParse({ name: "n".repeat(101) }).success,
    ).toBe(false)
  })
})

describe("addTrackSchema", () => {
  const valid = {
    name: "Track",
    linkId: "abc",
    duration: "3:45",
    thumbnailImage: "https://img/x.jpg",
  }

  it("정상 입력 통과 / thumbnail 생략 통과", () => {
    expect(addTrackSchema.safeParse(valid).success).toBe(true)
    const { thumbnailImage: _omit, ...noThumb } = valid
    expect(addTrackSchema.safeParse(noThumb).success).toBe(true)
  })

  it("name 200자 통과 / 201자 실패", () => {
    expect(
      addTrackSchema.safeParse({ ...valid, name: "n".repeat(200) }).success,
    ).toBe(true)
    expect(
      addTrackSchema.safeParse({ ...valid, name: "n".repeat(201) }).success,
    ).toBe(false)
  })

  it("linkId 100자 통과 / 101자 실패 / 빈 실패", () => {
    expect(
      addTrackSchema.safeParse({ ...valid, linkId: "l".repeat(100) }).success,
    ).toBe(true)
    expect(
      addTrackSchema.safeParse({ ...valid, linkId: "l".repeat(101) }).success,
    ).toBe(false)
    expect(addTrackSchema.safeParse({ ...valid, linkId: "" }).success).toBe(
      false,
    )
  })

  it("duration 빈 문자열 실패 (NotBlank)", () => {
    expect(addTrackSchema.safeParse({ ...valid, duration: "" }).success).toBe(
      false,
    )
  })

  it("thumbnailImage 1000자 통과 / 1001자 실패", () => {
    expect(
      addTrackSchema.safeParse({ ...valid, thumbnailImage: "t".repeat(1000) })
        .success,
    ).toBe(true)
    expect(
      addTrackSchema.safeParse({ ...valid, thumbnailImage: "t".repeat(1001) })
        .success,
    ).toBe(false)
  })
})
