import { describe, it, expect } from "vitest"
import { toAvatarOption } from "../to-avatar-option"
import type { AvatarCatalogItem } from "@/entities/virtual-crew"

describe("toAvatarOption — boundary 매퍼", () => {
  const combinable: AvatarCatalogItem = {
    bodyUri: "https://cdn/body_001.png",
    name: "베이직 바디",
    thumbnailUri: "https://cdn/body_001_thumb.png",
    combinable: true,
    obtainableType: "BASIC",
  }

  it("각 필드를 올바른 대상 필드로 매핑한다", () => {
    const out = toAvatarOption(combinable)
    expect(out.value).toBe("https://cdn/body_001.png")
    expect(out.label).toBe("베이직 바디")
    expect(out.thumbnail).toBe("https://cdn/body_001_thumb.png")
    expect(out.combinable).toBe(true)
    expect(out.tier).toBe("BASIC")
  })

  it("obtainableType null 은 tier null 로 보존한다", () => {
    const out = toAvatarOption({ ...combinable, obtainableType: null })
    expect(out.tier).toBeNull()
  })

  it("source 의 bodyUri/name/thumbnailUri/obtainableType 어휘를 그대로 흘려보내지 않는다", () => {
    const out = toAvatarOption(combinable) as unknown as Record<string, unknown>
    expect(out.bodyUri).toBeUndefined()
    expect(out.name).toBeUndefined()
    expect(out.thumbnailUri).toBeUndefined()
    expect(out.obtainableType).toBeUndefined()
  })
})
