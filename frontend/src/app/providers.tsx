import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect, type ReactNode } from 'react'

import { applicationQueryClient } from '@/application/core/query-client'
import { AppErrorBoundary } from '@/components/error-boundary/AppErrorBoundary'
import { ensureMasterDataBootstrapped } from '@/performance/master-data-bootstrap'
import { recordMetric } from '@/performance/performance-monitor'
import { keplerLogger } from '@/performance/logger'

const APP_START = performance.now()

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    ensureMasterDataBootstrapped()
    recordMetric('application-startup', performance.now() - APP_START, 'page')
    keplerLogger.info('Kepler ERP başlatıldı')
  }, [])

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={applicationQueryClient}>
        {children}
      </QueryClientProvider>
    </AppErrorBoundary>
  )
}
