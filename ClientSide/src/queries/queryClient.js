import { QueryClient } from '@tanstack/react-query'

/**
 * Decide whether a failed query should retry.
 *
 * @param {number} failureCount - The number of times the query has already failed.
 * @param {unknown} error - The error payload returned from the failed request.
 * @returns {boolean} True when the query should retry again, false otherwise.
 */
const shouldRetryRequest = (failureCount, error) => {
  if (error?.status === 401) {
    return false
  }

  return failureCount < 2
}

/**
 * Shared React Query client configured for the application.
 *
 * Queries use a short stale time, disabled window refetching, and a custom retry guard.
 * Mutations do not retry automatically.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: shouldRetryRequest,
    },
    mutations: {
      retry: false,
    },
  },
})
