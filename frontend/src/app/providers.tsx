import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'

import { applicationQueryClient } from '@/application/core/query-client'
import { AppErrorBoundary } from '@/components/error-boundary/AppErrorBoundary'
import { recordMetric } from '@/performance/performance-monitor'
import { keplerLogger } from '@/performance/logger'

const APP_START = performance.now()

export function AppProviders({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void import('@/infrastructure/persistence/bootstrap')
      .then(({ ensurePersistenceBootstrapped }) => ensurePersistenceBootstrapped())
      .then(() => {
        recordMetric('application-startup', performance.now() - APP_START, 'page')
        keplerLogger.info('Kepler ERP başlatıldı')
        setReady(true)
      })
  }, [])

  if (!ready) {
    return null
  }

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={applicationQueryClient}>
        {children}
      </QueryClientProvider>
    </AppErrorBoundary>
  )
}
