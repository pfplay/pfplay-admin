import { describe, it, expect } from "vitest"
import { server } from "@/test/mocks/server"
import { http, HttpResponse } from "msw"
import { getChatConfig, updateChatConfig } from "../chat-config-api"
import { ApiError } from "@/shared/api/error"

const payload = {
  chatEnabled: true,
  selfUpdateEnabled: false,
  probabilityPercent: 50,
  cooldownSeconds: 15,
  contextSize: 10,
  outputMaxTokens: 200,
}

describe("chat-config-api", () => {
  it("getChatConfig — GET 설정 unwrap", async () => {
    server.use(
      http.get("*/api/v1/admin/virtual-dj/chat-config", () =>
        HttpResponse.json({ data: payload }),
      ),
    )
    const r = await getChatConfig()
    expect(r).toEqual(payload)
  })

  it("updateChatConfig — PUT body 6필드 (204)", async () => {
    let bodySeen: unknown
    let methodSeen: string | undefined
    server.use(
      http.put(
        "*/api/v1/admin/virtual-dj/chat-config",
        async ({ request }) => {
          methodSeen = request.method
          bodySeen = await request.json()
          return new HttpResponse(null, { status: 204 })
        },
      ),
    )
    await expect(updateChatConfig(payload)).resolves.toBeUndefined()
    expect(methodSeen).toBe("PUT")
    expect(bodySeen).toEqual(payload)
  })

  it("getChatConfig — 500 → ApiError 전파", async () => {
    server.use(
      http.get("*/api/v1/admin/virtual-dj/chat-config", () =>
        HttpResponse.json(
          { status: 500, errorCode: "INTERNAL_ERROR", message: "오류" },
          { status: 500 },
        ),
      ),
    )
    await expect(getChatConfig()).rejects.toBeInstanceOf(ApiError)
  })

  it("updateChatConfig — 400 (검증 실패) → ApiError 전파", async () => {
    server.use(
      http.put("*/api/v1/admin/virtual-dj/chat-config", () =>
        HttpResponse.json(
          { status: 400, errorCode: "INVALID_INPUT", message: "잘못된 값" },
          { status: 400 },
        ),
      ),
    )
    await expect(updateChatConfig(payload)).rejects.toBeInstanceOf(ApiError)
  })
})
