import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { VirtualUser } from "./types"

interface UsersState {
  users: VirtualUser[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchUsers: () => Promise<void>
  createUser: (userData: Partial<VirtualUser>) => Promise<void>
  deleteUser: (userId: string) => Promise<void>
  updateUser: (userId: string, updates: Partial<VirtualUser>) => void
  getUserById: (userId: string) => VirtualUser | undefined
  getUsersInRoom: (roomId?: string) => VirtualUser[]
  getAvailableUsers: () => VirtualUser[]
}

export const useUsersStore = create<UsersState>()(
  devtools(
    (set, get) => ({
      users: [],
      isLoading: false,
      error: null,

      fetchUsers: async () => {
        set({ isLoading: true, error: null })
        try {
          // Mock data for development
          const mockUsers: VirtualUser[] = Array.from({ length: 15 }, (_, i) => ({
            id: `user${i + 1}`,
            username: `테스트유저${i + 1}`,
            email: `user${i + 1}@test.com`,
            tier: ["free", "premium", "vip"][i % 3] as VirtualUser["tier"],
            status: "active" as const,
            isInRoom: i < 12,
            currentRoomId: i < 12 ? "ROOM-1001" : undefined,
            createdAt: new Date(),
            lastActiveAt: new Date(),
          }))
          set({ users: mockUsers, isLoading: false })

          // Real API call (uncomment when backend is ready)
          // const users = await apiClient.getUsers()
          // set({ users, isLoading: false })
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      createUser: async (_userData) => {
        set({ isLoading: true, error: null })
        try {
          // await apiClient.createUser(userData)
          await get().fetchUsers()
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      deleteUser: async (userId) => {
        set({ isLoading: true, error: null })
        try {
          // await apiClient.deleteUser(userId)
          set((state) => ({
            users: state.users.filter((user) => user.id !== userId),
            isLoading: false,
          }))
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      updateUser: (userId, updates) => {
        set((state) => ({
          users: state.users.map((user) => (user.id === userId ? { ...user, ...updates } : user)),
        }))
      },

      getUserById: (userId) => {
        return get().users.find((user) => user.id === userId)
      },

      getUsersInRoom: (roomId) => {
        return get().users.filter((user) => user.isInRoom && user.currentRoomId === roomId)
      },

      getAvailableUsers: () => {
        return get().users.filter((user) => !user.isInRoom)
      },
    }),
    { name: "users-store" },
  ),
)
