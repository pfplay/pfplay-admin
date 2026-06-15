import { describe, it, expect } from "vitest"
import { server } from "@/test/mocks/server"
import { http, HttpResponse } from "msw"
import { getPoolSummary, provisionPool } from "../pool-api"
import { ApiError } from "@/shared/api/error"

describe("pool-api", () => {
  it("getPoolSummary — GET 봇 풀 요약 unwrap", async () => {
    server.use(
      http.get("*/api/v1/admin/virtual-dj/pool", () =>
        HttpResponse.json({
          data: {
            total: 10,
            idle: 4,
            placed: [
              { partyroomId: 1, partyroomTitle: "메인", botCount: 3 },
              { partyroomId: 2, partyroomTitle: "서브", botCount: 3 },
            ],
          },
        }),
      ),
    )
    const r = await getPoolSummary()
    expect(r.total).toBe(10)
    expect(r.idle).toBe(4)
    expect(r.placed).toHaveLength(2)
    expect(r.placed[0]).toEqual({
      partyroomId: 1,
      partyroomTitle: "메인",
      botCount: 3,
    })
  })

  it("provisionPool — POST body {count} 전송", async () => {
    let bodySeen: unknown
    server.use(
      // backend 는 201 + 공통 응답 envelope ({data:null}) 를 반환한다 — 기존 penalty
      // POST 엔드포인트와 동일한 패턴. http 클라이언트는 204 만 본문 스킵하므로 JSON 필요.
      http.post("*/api/v1/admin/virtual-dj/pool", async ({ request }) => {
        bodySeen = await request.json()
        return HttpResponse.json({ data: null }, { status: 201 })
      }),
    )
    await expect(provisionPool(25)).resolves.toBeUndefined()
    expect(bodySeen).toEqual({ count: 25 })
  })

  it("provisionPool — 서버 에러 시 ApiError 전파", async () => {
    server.use(
      http.post("*/api/v1/admin/virtual-dj/pool", () =>
        HttpResponse.json(
          { status: 400, errorCode: "VDJ-001", message: "invalid" },
          { status: 400 },
        ),
      ),
    )
    await expect(provisionPool(5)).rejects.toBeInstanceOf(ApiError)
  })
})
