import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { AuthProvider } from '@/application/platform/iam/auth-context'
import { applicationQueryClient } from '@/application/core/query-client'
import { AppErrorBoundary } from '@/components/error-boundary/AppErrorBoundary'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={applicationQueryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  )
}
