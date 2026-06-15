import { describe, it, expect } from "vitest"
import { server } from "@/test/mocks/server"
import { http, HttpResponse } from "msw"
import { getAvatarCatalog } from "../avatar-catalog-api"
import { ApiError } from "@/shared/api/error"

describe("avatar-catalog-api", () => {
  it("getAvatarCatalog — GET 카탈로그 unwrap", async () => {
    server.use(
      http.get("*/api/v1/admin/virtual-dj/avatar-catalog", () =>
        HttpResponse.json({
          data: [
            {
              bodyUri: "https://cdn/body_001.png",
              name: "베이직 바디",
              thumbnailUri: "https://cdn/body_001_thumb.png",
              combinable: true,
              obtainableType: "BASIC",
            },
            {
              bodyUri: "https://cdn/body_002.png",
              name: "스탠드얼론",
              thumbnailUri: "https://cdn/body_002_thumb.png",
              combinable: false,
              obtainableType: null,
            },
          ],
        }),
      ),
    )
    const r = await getAvatarCatalog()
    expect(r).toHaveLength(2)
    expect(r[0]).toEqual({
      bodyUri: "https://cdn/body_001.png",
      name: "베이직 바디",
      thumbnailUri: "https://cdn/body_001_thumb.png",
      combinable: true,
      obtainableType: "BASIC",
    })
    expect(r[1].combinable).toBe(false)
    expect(r[1].obtainableType).toBeNull()
  })

  it("getAvatarCatalog — 서버 에러 시 ApiError 전파", async () => {
    server.use(
      http.get("*/api/v1/admin/virtual-dj/avatar-catalog", () =>
        HttpResponse.json(
          { status: 500, errorCode: "X", message: "boom" },
          { status: 500 },
        ),
      ),
    )
    await expect(getAvatarCatalog()).rejects.toBeInstanceOf(ApiError)
  })
})
