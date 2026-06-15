import { describe, it, expect } from "vitest"
import { server } from "@/test/mocks/server"
import { http, HttpResponse } from "msw"
import { searchMusics } from "../search-api"
import { ApiError } from "@/shared/api/error"

describe("search-api", () => {
  it("searchMusics — envelope 를 unwrap 하고 musicList 배열을 반환", async () => {
    server.use(
      http.get("*/api/v1/admin/virtual-dj/music-search", () =>
        HttpResponse.json({
          data: {
            musicList: [
              {
                videoId: "dQw4w9WgXcQ",
                videoTitle: "Never Gonna Give You Up",
                runningTime: "3:33",
                thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg",
              },
              {
                videoId: "abc123",
                videoTitle: "Another Song",
                runningTime: "4:00",
                thumbnailUrl: "https://i.ytimg.com/vi/abc123/default.jpg",
              },
            ],
          },
        }),
      ),
    )
    const list = await searchMusics("rick")
    expect(Array.isArray(list)).toBe(true)
    expect(list).toHaveLength(2)
    expect(list[0]).toEqual({
      videoId: "dQw4w9WgXcQ",
      videoTitle: "Never Gonna Give You Up",
      runningTime: "3:33",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg",
    })
  })

  it("searchMusics — q 쿼리 파라미터를 인코딩하여 전송", async () => {
    let urlSeen = ""
    server.use(
      http.get("*/api/v1/admin/virtual-dj/music-search", ({ request }) => {
        urlSeen = request.url
        return HttpResponse.json({ data: { musicList: [] } })
      }),
    )
    await searchMusics("a b&c")
    expect(urlSeen).toContain("q=a%20b%26c")
  })

  it("searchMusics — 빈 musicList 도 정상적으로 빈 배열 반환", async () => {
    server.use(
      http.get("*/api/v1/admin/virtual-dj/music-search", () =>
        HttpResponse.json({ data: { musicList: [] } }),
      ),
    )
    await expect(searchMusics("none")).resolves.toEqual([])
  })

  it("searchMusics — 서버 에러 시 ApiError 전파", async () => {
    server.use(
      http.get("*/api/v1/admin/virtual-dj/music-search", () =>
        HttpResponse.json(
          { status: 500, errorCode: "VDJ-900", message: "boom" },
          { status: 500 },
        ),
      ),
    )
    await expect(searchMusics("x")).rejects.toBeInstanceOf(ApiError)
  })
})
