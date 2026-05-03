import { describe, it, expect } from "vitest"
import { server } from "@/test/mocks/server"
import { http, HttpResponse } from "msw"
import {
  listAdministrators,
  createAdministrator,
  updateAdministrator,
  revokeAdministrator,
  resetAdministratorPassword,
  attachMemberProfile,
  findAdministratorByIdFromList,
} from "../administrators-api"
import { ApiError } from "@/shared/api/error"
import { adminMgtNotFoundError } from "@/test/mocks/fixtures/administrators"

describe("administrators-api", () => {
  it("listAdministrators — query params 직렬화 + unwrap", async () => {
    let captured: URL | undefined
    server.use(
      http.get("*/api/v1/admin/system/administrators", ({ request }) => {
        captured = new URL(request.url)
        return HttpResponse.json({ data: { totalCount: 0, items: [] } })
      }),
    )
    await listAdministrators({ role: "ADMIN", includeRevoked: true })
    expect(captured!.searchParams.get("role")).toBe("ADMIN")
    expect(captured!.searchParams.get("includeRevoked")).toBe("true")
  })

  it("listAdministrators — default (filter 없음) 4건 반환", async () => {
    const r = await listAdministrators({})
    expect(r.totalCount).toBe(4)
    expect(r.items.map((a) => a.administratorId)).toEqual([1, 2, 3, 5])
  })

  it("listAdministrators — includeRevoked=true → 5건", async () => {
    const r = await listAdministrators({ includeRevoked: true })
    expect(r.totalCount).toBe(5)
    expect(r.items.find((a) => a.revokedAt !== null)).toBeDefined()
  })

  it("createAdministrator — body 전송 + tempPassword 응답", async () => {
    let bodySeen: unknown
    server.use(
      http.post("*/api/v1/admin/system/administrators", async ({ request }) => {
        bodySeen = await request.json()
        return HttpResponse.json({
          data: {
            administratorId: 99,
            userAccountId: 199,
            memberId: 199,
            tempPassword: "TmpP@ss-1",
            message: "ok",
          },
        })
      }),
    )
    const r = await createAdministrator({
      email: "new@pfplay.local",
      nickname: "신규",
      includeMemberProfile: true,
    })
    expect(bodySeen).toEqual({
      email: "new@pfplay.local",
      nickname: "신규",
      includeMemberProfile: true,
    })
    expect(r.tempPassword).toBe("TmpP@ss-1")
  })

  it("updateAdministrator — PATCH 204", async () => {
    await expect(updateAdministrator(2, { nickname: "변경" })).resolves.toBeUndefined()
  })

  it("revokeAdministrator — POST 204", async () => {
    await expect(revokeAdministrator(2)).resolves.toBeUndefined()
  })

  it("resetAdministratorPassword — tempPassword 응답", async () => {
    const r = await resetAdministratorPassword(2)
    expect(r.tempPassword).toBeTruthy()
  })

  it("attachMemberProfile — memberId 응답", async () => {
    const r = await attachMemberProfile(2, { nickname: "운영자A" })
    expect(r.memberId).toBe(199)
  })

  it("ADM_MGT_001 NOT_FOUND → ApiError 전파", async () => {
    server.use(
      http.post("*/api/v1/admin/system/administrators/9999/revoke", () =>
        HttpResponse.json(adminMgtNotFoundError, { status: 404 }),
      ),
    )
    await expect(revokeAdministrator(9999)).rejects.toBeInstanceOf(ApiError)
    await expect(revokeAdministrator(9999)).rejects.toMatchObject({
      status: 404,
      errorCode: "ADM_MGT_001",
    })
  })

  it("findAdministratorByIdFromList — 존재 시 view 반환, 부재 시 undefined", async () => {
    const found = await findAdministratorByIdFromList(2)
    expect(found?.administratorId).toBe(2)
    const missing = await findAdministratorByIdFromList(9999)
    expect(missing).toBeUndefined()
  })
})
