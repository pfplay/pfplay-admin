import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { PartyRoom } from "./types"
import { apiClient } from "@/shared/lib/api-client"

interface RoomsState {
  rooms: PartyRoom[]
  selectedRoomId: number | null
  isLoading: boolean
  error: string | null

  // Actions
  fetchRooms: () => Promise<void>
  selectRoom: (roomId: number | null) => void
  getSelectedRoom: () => PartyRoom | undefined
}

export const useRoomsStore = create<RoomsState>()(
  devtools(
    (set, get) => ({
      rooms: [],
      selectedRoomId: null,
      isLoading: false,
      error: null,

      fetchRooms: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiClient.getPartyrooms()
          const rooms: PartyRoom[] = response.partyrooms.map((room) => ({
            id: room.partyroomId,
            name: room.title,
            stageType: room.stageType as "MAIN" | "GENERAL",
            linkDomain: room.linkDomain,
            crewCount: room.crewCount,
            djCount: room.djCount,
            isPlaybackActivated: room.isPlaybackActivated,
          }))
          set({ rooms, isLoading: false })
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      selectRoom: (roomId) => {
        set({ selectedRoomId: roomId })
      },

      getSelectedRoom: () => {
        const { rooms, selectedRoomId } = get()
        return rooms.find((room) => room.id === selectedRoomId)
      },
    }),
    { name: "rooms-store" },
  ),
)
