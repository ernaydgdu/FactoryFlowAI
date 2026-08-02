import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'

import { AppErrorBoundary } from '@/components/error-boundary/AppErrorBoundary'
import { PageLoader } from '@/components/error-boundary/PageLoader'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyPage(
  factory: () => Promise<Record<string, ComponentType<any>>>,
  exportName: string,
) {
  return lazy(() =>
    factory().then((mod) => ({
      default: mod[exportName],
    })),
  )
}

export function LazyRoute({ children }: { children: ReactNode }) {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </AppErrorBoundary>
  )
}

export function trackPageLoad(pageName: string): void {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(`page-${pageName}-start`)
  }
}
