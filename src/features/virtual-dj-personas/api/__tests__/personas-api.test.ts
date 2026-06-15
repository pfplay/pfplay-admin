import { describe, it, expect } from "vitest"
import { server } from "@/test/mocks/server"
import { http, HttpResponse } from "msw"
import {
  listPersonas,
  getPersona,
  createPersona,
  updatePersona,
  deletePersona,
} from "../personas-api"
import { ApiError } from "@/shared/api/error"

describe("personas-api", () => {
  it("listPersonas — GET 페르소나 목록 unwrap", async () => {
    server.use(
      http.get("*/api/v1/admin/virtual-dj/personas", () =>
        HttpResponse.json({
          data: [
            { id: 1, name: "친근한 DJ", active: true },
            { id: 2, name: "시크한 DJ", active: false },
          ],
        }),
      ),
    )
    const r = await listPersonas()
    expect(r).toHaveLength(2)
    expect(r[0]).toEqual({ id: 1, name: "친근한 DJ", active: true })
    expect(r[1].active).toBe(false)
  })

  it("getPersona — GET 페르소나 상세 unwrap (instruction 포함)", async () => {
    server.use(
      http.get("*/api/v1/admin/virtual-dj/personas/7", () =>
        HttpResponse.json({
          data: {
            id: 7,
            name: "재즈 DJ",
            instruction: "차분하게 응답하라",
            active: true,
          },
        }),
      ),
    )
    const r = await getPersona(7)
    expect(r.id).toBe(7)
    expect(r.instruction).toBe("차분하게 응답하라")
    expect(r.active).toBe(true)
  })

  it("createPersona — POST body {name,instruction} → id 반환", async () => {
    let bodySeen: unknown
    server.use(
      http.post("*/api/v1/admin/virtual-dj/personas", async ({ request }) => {
        bodySeen = await request.json()
        return HttpResponse.json({ data: { id: 42 } }, { status: 201 })
      }),
    )
    const id = await createPersona({
      name: "새 페르소나",
      instruction: "지시문",
    })
    expect(id).toBe(42)
    expect(bodySeen).toEqual({ name: "새 페르소나", instruction: "지시문" })
  })

  it("updatePersona — PUT body {name,instruction,active} (204)", async () => {
    let bodySeen: unknown
    server.use(
      http.put("*/api/v1/admin/virtual-dj/personas/5", async ({ request }) => {
        bodySeen = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    await expect(
      updatePersona(5, {
        name: "변경된 이름",
        instruction: "변경된 지시문",
        active: false,
      }),
    ).resolves.toBeUndefined()
    expect(bodySeen).toEqual({
      name: "변경된 이름",
      instruction: "변경된 지시문",
      active: false,
    })
  })

  it("deletePersona — DELETE (204)", async () => {
    let called = false
    server.use(
      http.delete("*/api/v1/admin/virtual-dj/personas/9", () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    await expect(deletePersona(9)).resolves.toBeUndefined()
    expect(called).toBe(true)
  })

  it("409 (사용 중) → ApiError 전파", async () => {
    server.use(
      http.delete("*/api/v1/admin/virtual-dj/personas/3", () =>
        HttpResponse.json(
          {
            status: 409,
            errorCode: "PERSONA_IN_USE",
            message: "봇에 매핑된 페르소나입니다",
          },
          { status: 409 },
        ),
      ),
    )
    await expect(deletePersona(3)).rejects.toBeInstanceOf(ApiError)
  })

  it("404 (미존재) → ApiError 전파", async () => {
    server.use(
      http.get("*/api/v1/admin/virtual-dj/personas/999", () =>
        HttpResponse.json(
          { status: 404, errorCode: "PERSONA_NOT_FOUND", message: "없음" },
          { status: 404 },
        ),
      ),
    )
    await expect(getPersona(999)).rejects.toBeInstanceOf(ApiError)
  })
})
