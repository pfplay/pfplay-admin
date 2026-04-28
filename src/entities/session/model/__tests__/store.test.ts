import { describe, it, expect, beforeEach } from "vitest"
import { useSessionStore } from "../store"
import type { SessionMeta } from "../types"

const META: SessionMeta = {
  role: "ADMIN",
  mustChangePassword: false,
  issuedAt: "2026-04-28T10:00:00.000Z",
  expiresAt: "2026-04-28T10:15:00.000Z",
}

describe("entities/session/store.ts", () => {
  beforeEach(() => {
    localStorage.clear()
    useSessionStore.getState().clear()
  })

  it("setSession → isAuthenticated=true + meta 저장 + localStorage persist", () => {
    useSessionStore.getState().setSession(META)
    expect(useSessionStore.getState().isAuthenticated).toBe(true)
    expect(useSessionStore.getState().meta).toEqual(META)
    expect(localStorage.getItem("pfplay-admin-session")).toContain("ADMIN")
  })

  it("clear → 초기화 + localStorage 비움 (state)", () => {
    useSessionStore.getState().setSession(META)
    useSessionStore.getState().clear()
    expect(useSessionStore.getState().isAuthenticated).toBe(false)
    expect(useSessionStore.getState().meta).toBeNull()
    const stored = localStorage.getItem("pfplay-admin-session")
    expect(stored ? JSON.parse(stored).state.isAuthenticated : false).toBe(false)
  })

  it("clearMustChangePassword → meta.mustChangePassword=false (다른 필드 보존)", () => {
    useSessionStore.getState().setSession({ ...META, mustChangePassword: true })
    useSessionStore.getState().clearMustChangePassword()
    expect(useSessionStore.getState().meta).toEqual({ ...META, mustChangePassword: false })
  })
})
