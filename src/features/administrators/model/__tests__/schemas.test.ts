import { describe, it, expect } from "vitest"
import {
  createAdministratorRequestSchema,
  updateAdministratorRequestSchema,
  attachMemberProfileRequestSchema,
} from "../mutation-schema"
import { administratorListQuerySchema, AdminRoleEnum } from "../filter-schema"

describe("administrator schemas", () => {
  it("createAdministratorRequestSchema — 정상 케이스", () => {
    const r = createAdministratorRequestSchema.safeParse({
      email: "a@b.com",
      nickname: "x",
      includeMemberProfile: true,
    })
    expect(r.success).toBe(true)
  })

  it("createAdministratorRequestSchema — 이메일 형식 위반", () => {
    const r = createAdministratorRequestSchema.safeParse({
      email: "not-an-email",
      nickname: "x",
    })
    expect(r.success).toBe(false)
  })

  it("createAdministratorRequestSchema — nickname 공백 거부", () => {
    const r = createAdministratorRequestSchema.safeParse({
      email: "a@b.com",
      nickname: "",
    })
    expect(r.success).toBe(false)
  })

  it("createAdministratorRequestSchema — nickname 64자 초과 거부", () => {
    const r = createAdministratorRequestSchema.safeParse({
      email: "a@b.com",
      nickname: "x".repeat(65),
    })
    expect(r.success).toBe(false)
  })

  it("createAdministratorRequestSchema — includeMemberProfile 미지정 허용", () => {
    const r = createAdministratorRequestSchema.safeParse({
      email: "a@b.com",
      nickname: "x",
    })
    expect(r.success).toBe(true)
  })

  it("updateAdministratorRequestSchema — nickname required", () => {
    expect(updateAdministratorRequestSchema.safeParse({ nickname: "" }).success).toBe(false)
    expect(updateAdministratorRequestSchema.safeParse({ nickname: "z" }).success).toBe(true)
  })

  it("attachMemberProfileRequestSchema — nickname required", () => {
    expect(attachMemberProfileRequestSchema.safeParse({ nickname: "" }).success).toBe(false)
    expect(attachMemberProfileRequestSchema.safeParse({ nickname: "z" }).success).toBe(true)
  })

  it("AdminRoleEnum — 2종만 허용", () => {
    expect(AdminRoleEnum.options).toEqual(["SUPER_ADMIN", "ADMIN"])
  })

  it("administratorListQuerySchema — 모든 필드 optional", () => {
    expect(administratorListQuerySchema.safeParse({}).success).toBe(true)
    expect(
      administratorListQuerySchema.safeParse({ role: "ADMIN", includeRevoked: false }).success,
    ).toBe(true)
  })
})
