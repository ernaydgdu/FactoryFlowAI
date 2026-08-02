import { QueryClient } from '@tanstack/react-query'

export const applicationQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
})

/** Master Data — uygulama oturumu boyunca cache (tekrar istek yok) */
export const MASTER_DATA_STALE_TIME = Infinity
export const ENTITY_CACHE_GC_TIME = 24 * 60 * 60 * 1000
