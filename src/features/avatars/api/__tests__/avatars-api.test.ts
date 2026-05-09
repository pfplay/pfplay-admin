import { describe, it, expect } from "vitest"
import { server } from "@/test/mocks/server"
import { http, HttpResponse } from "msw"
import {
  listBodies,
  listFaces,
  getBody,
  getFace,
  publishBody,
  retireBody,
  publishFace,
  retireFace,
} from "../avatars-api"
import { ApiError } from "@/shared/api/error"

describe("avatars-api", () => {
  it("listBodies + filter 직렬화", async () => {
    let captured: URL | undefined
    server.use(
      http.get("*/api/v1/admin/avatar/bodies", ({ request }) => {
        captured = new URL(request.url)
        return HttpResponse.json({ data: [] })
      }),
    )
    await listBodies({ status: "PUBLISHED", obtainableType: "DJ_PNT" })
    expect(captured!.searchParams.get("status")).toBe("PUBLISHED")
    expect(captured!.searchParams.get("obtainableType")).toBe("DJ_PNT")
  })

  it("listFaces + status filter", async () => {
    let captured: URL | undefined
    server.use(
      http.get("*/api/v1/admin/avatar/faces", ({ request }) => {
        captured = new URL(request.url)
        return HttpResponse.json({ data: [] })
      }),
    )
    await listFaces({ status: "DRAFT" })
    expect(captured!.searchParams.get("status")).toBe("DRAFT")
  })

  it("getBody unwrap + 404", async () => {
    const r = await getBody(1)
    expect(r.id).toBe(1)
    await expect(getBody(9999)).rejects.toMatchObject({
      status: 404,
      errorCode: "AVT-009",
    })
    await expect(getBody(9999)).rejects.toBeInstanceOf(ApiError)
  })

  it("getFace unwrap", async () => {
    const r = await getFace(1)
    expect(r.id).toBe(1)
  })

  it("publishBody POST + 204", async () => {
    let posted = false
    server.use(
      http.post("*/api/v1/admin/avatar/bodies/1/publish", () => {
        posted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    await publishBody(1)
    expect(posted).toBe(true)
  })

  it("retireBody POST body shape + 204", async () => {
    let bodySeen: unknown
    server.use(
      http.post("*/api/v1/admin/avatar/bodies/1/retire", async ({ request }) => {
        bodySeen = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    await retireBody(1, { reason: "회수 사유" })
    expect(bodySeen).toEqual({ reason: "회수 사유" })
  })

  it("publishFace + retireFace 동일 패턴", async () => {
    await expect(publishFace(1)).resolves.toBeUndefined()
    await expect(retireFace(1, { reason: "x" })).resolves.toBeUndefined()
  })

  it("publish AVT-005 → ApiError 전파", async () => {
    server.use(
      http.post("*/api/v1/admin/avatar/bodies/1/publish", () =>
        HttpResponse.json(
          { status: 409, errorCode: "AVT-005", message: "전이 불가" },
          { status: 409 },
        ),
      ),
    )
    await expect(publishBody(1)).rejects.toMatchObject({
      status: 409,
      errorCode: "AVT-005",
    })
  })
})
