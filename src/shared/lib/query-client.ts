import { QueryClient } from "@tanstack/react-query"
import { ApiError } from "@/shared/api/error"

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 30_000,
        retry: (failureCount, error) => {
          if (error instanceof ApiError) return false
          return failureCount < 1
        },
      },
    },
  })
}
