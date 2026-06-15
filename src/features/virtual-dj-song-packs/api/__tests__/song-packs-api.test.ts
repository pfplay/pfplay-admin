import { describe, it, expect } from "vitest"
import { server } from "@/test/mocks/server"
import { http, HttpResponse } from "msw"
import {
  listSongPacks,
  getSongPack,
  createSongPack,
  renameSongPack,
  deleteSongPack,
  addTrack,
  removeTrack,
} from "../song-packs-api"
import { ApiError } from "@/shared/api/error"

describe("song-packs-api", () => {
  it("listSongPacks — GET 송팩 목록 unwrap", async () => {
    server.use(
      http.get("*/api/v1/admin/virtual-dj/song-packs", () =>
        HttpResponse.json({
          data: [
            { id: 1, name: "여름", description: "여름 시즌", trackCount: 12 },
            { id: 2, name: "겨울", description: null, trackCount: 3 },
          ],
        }),
      ),
    )
    const r = await listSongPacks()
    expect(r).toHaveLength(2)
    expect(r[0]).toEqual({
      id: 1,
      name: "여름",
      description: "여름 시즌",
      trackCount: 12,
    })
    expect(r[1].description).toBeNull()
  })

  it("getSongPack — GET 송팩 상세 unwrap (트랙 포함)", async () => {
    server.use(
      http.get("*/api/v1/admin/virtual-dj/song-packs/7", () =>
        HttpResponse.json({
          data: {
            id: 7,
            name: "재즈",
            description: null,
            tracks: [
              {
                trackId: 100,
                name: "Track A",
                linkId: "abc123",
                duration: "3:45",
                thumbnailImage: "https://img/x.jpg",
              },
            ],
          },
        }),
      ),
    )
    const r = await getSongPack(7)
    expect(r.id).toBe(7)
    expect(r.tracks).toHaveLength(1)
    expect(r.tracks[0].trackId).toBe(100)
  })

  it("createSongPack — POST body {name,description} → id 반환", async () => {
    let bodySeen: unknown
    server.use(
      http.post(
        "*/api/v1/admin/virtual-dj/song-packs",
        async ({ request }) => {
          bodySeen = await request.json()
          return HttpResponse.json({ data: { id: 42 } }, { status: 201 })
        },
      ),
    )
    const id = await createSongPack({ name: "새 팩", description: "설명" })
    expect(id).toBe(42)
    expect(bodySeen).toEqual({ name: "새 팩", description: "설명" })
  })

  it("renameSongPack — PUT body {name} (204)", async () => {
    let bodySeen: unknown
    server.use(
      http.put(
        "*/api/v1/admin/virtual-dj/song-packs/5",
        async ({ request }) => {
          bodySeen = await request.json()
          return new HttpResponse(null, { status: 204 })
        },
      ),
    )
    await expect(
      renameSongPack(5, { name: "변경된 이름" }),
    ).resolves.toBeUndefined()
    expect(bodySeen).toEqual({ name: "변경된 이름" })
  })

  it("deleteSongPack — DELETE (204)", async () => {
    let called = false
    server.use(
      http.delete("*/api/v1/admin/virtual-dj/song-packs/9", () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    await expect(deleteSongPack(9)).resolves.toBeUndefined()
    expect(called).toBe(true)
  })

  it("addTrack — POST .../tracks body → id 반환", async () => {
    let bodySeen: unknown
    server.use(
      http.post(
        "*/api/v1/admin/virtual-dj/song-packs/3/tracks",
        async ({ request }) => {
          bodySeen = await request.json()
          return HttpResponse.json({ data: { id: 555 } }, { status: 201 })
        },
      ),
    )
    const id = await addTrack(3, {
      name: "Track B",
      linkId: "xyz",
      duration: "4:20",
      thumbnailImage: "https://img/b.jpg",
    })
    expect(id).toBe(555)
    expect(bodySeen).toEqual({
      name: "Track B",
      linkId: "xyz",
      duration: "4:20",
      thumbnailImage: "https://img/b.jpg",
    })
  })

  it("removeTrack — DELETE .../tracks/{trackId} (204)", async () => {
    let called = false
    server.use(
      http.delete(
        "*/api/v1/admin/virtual-dj/song-packs/3/tracks/100",
        () => {
          called = true
          return new HttpResponse(null, { status: 204 })
        },
      ),
    )
    await expect(removeTrack(3, 100)).resolves.toBeUndefined()
    expect(called).toBe(true)
  })

  it("409 (이름 중복/사용중) → ApiError 전파", async () => {
    server.use(
      http.post("*/api/v1/admin/virtual-dj/song-packs", () =>
        HttpResponse.json(
          {
            status: 409,
            errorCode: "SONG_PACK_NAME_DUPLICATED",
            message: "중복된 이름",
          },
          { status: 409 },
        ),
      ),
    )
    await expect(
      createSongPack({ name: "중복", description: null }),
    ).rejects.toBeInstanceOf(ApiError)
  })

  it("404 (미존재) → ApiError 전파", async () => {
    server.use(
      http.get("*/api/v1/admin/virtual-dj/song-packs/999", () =>
        HttpResponse.json(
          { status: 404, errorCode: "SONG_PACK_NOT_FOUND", message: "없음" },
          { status: 404 },
        ),
      ),
    )
    await expect(getSongPack(999)).rejects.toBeInstanceOf(ApiError)
  })
})
