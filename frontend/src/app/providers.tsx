import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'

import { AuthProvider } from '@/application/platform/iam/auth-context'
import { applicationQueryClient } from '@/application/core/query-client'
import { AppErrorBoundary } from '@/components/error-boundary/AppErrorBoundary'
import {
  getBootstrapDiagnostics,
  type BootstrapDiagnosticsSnapshot,
} from '@/infrastructure/persistence/bootstrap-diagnostics'
import { recordMetric } from '@/performance/performance-monitor'
import { keplerLogger } from '@/performance/logger'

const APP_START = performance.now()

function BootstrapStatusScreen({
  diagnostics,
  fatal,
}: {
  diagnostics: BootstrapDiagnosticsSnapshot
  fatal: boolean
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center">
      <h1 className="text-xl font-semibold">
        {fatal ? 'Bootstrap failed' : 'Kepler ERP starting…'}
      </h1>
      <p className="max-w-lg text-sm text-muted-foreground">
        {fatal
          ? 'Critical persistence wiring failed. Review diagnostics below — the app will not white-screen.'
          : 'Loading persistence runtime and seed data.'}
      </p>
      <div className="w-full max-w-xl rounded-md border p-4 text-left text-xs space-y-2">
        <div>
          Status: <strong>{diagnostics.overall}</strong> · backend {diagnostics.backend}
        </div>
        {diagnostics.fatalError ? (
          <div className="text-destructive">{diagnostics.fatalError}</div>
        ) : null}
        <ul className="space-y-1">
          {diagnostics.phases.map((p) => (
            <li key={p.id}>
              [{p.status}] {p.label}
              {p.error ? ` — ${p.error}` : ''} ({p.durationMs}ms)
            </li>
          ))}
        </ul>
      </div>
      {fatal ? (
        <button
          type="button"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      ) : null}
    </div>
  )
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [fatal, setFatal] = useState(false)
  const [diagnostics, setDiagnostics] = useState<BootstrapDiagnosticsSnapshot>(() =>
    getBootstrapDiagnostics(),
  )

  useEffect(() => {
    let cancelled = false
    void import('@/infrastructure/persistence/bootstrap')
      .then(async ({ ensurePersistenceBootstrappedSafe }) => {
        const result = await ensurePersistenceBootstrappedSafe()
        if (cancelled) return
        const snap = getBootstrapDiagnostics()
        setDiagnostics(snap)
        if (result.ready) {
          recordMetric('application-startup', performance.now() - APP_START, 'page', {
            degraded: result.degraded,
          })
          keplerLogger.info('Kepler ERP başlatıldı', { degraded: result.degraded })
          setReady(true)
          setFatal(false)
        } else {
          keplerLogger.error('Bootstrap failed', { fatal: snap.fatalError })
          setFatal(true)
          setReady(false)
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        keplerLogger.error('Bootstrap import/runtime failure', {
          message: err instanceof Error ? err.message : String(err),
        })
        setDiagnostics(getBootstrapDiagnostics())
        setFatal(true)
        setReady(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) {
    return <BootstrapStatusScreen diagnostics={diagnostics} fatal={fatal} />
  }

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={applicationQueryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  )
}
