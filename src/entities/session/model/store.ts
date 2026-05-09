import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { SessionMeta } from "./types"

interface SessionState {
  isAuthenticated: boolean
  meta: SessionMeta | null
  setSession: (meta: SessionMeta) => void
  clearMustChangePassword: () => void
  clear: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      meta: null,
      setSession: (meta) => set({ isAuthenticated: true, meta }),
      clearMustChangePassword: () =>
        set((s) => (s.meta ? { meta: { ...s.meta, mustChangePassword: false } } : s)),
      clear: () => set({ isAuthenticated: false, meta: null }),
    }),
    {
      name: "pfplay-admin-session",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
)
