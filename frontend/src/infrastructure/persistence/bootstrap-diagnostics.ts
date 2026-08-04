/**
 * Bootstrap diagnostics — isolate partial failures; never leave UI without a status.
 */

export type BootstrapPhaseStatus = 'pending' | 'ok' | 'failed' | 'skipped'

export type BootstrapPhaseRecord = {
  id: string
  label: string
  status: BootstrapPhaseStatus
  durationMs: number
  error: string | null
  isolated: boolean
}

export type BootstrapDiagnosticsSnapshot = {
  startedAt: string | null
  finishedAt: string | null
  overall: 'idle' | 'running' | 'ready' | 'degraded' | 'failed'
  backend: string
  phases: BootstrapPhaseRecord[]
  fatalError: string | null
  ready: boolean
}

let snapshot: BootstrapDiagnosticsSnapshot = {
  startedAt: null,
  finishedAt: null,
  overall: 'idle',
  backend: 'memory',
  phases: [],
  fatalError: null,
  ready: false,
}

export function resetBootstrapDiagnostics(): void {
  snapshot = {
    startedAt: null,
    finishedAt: null,
    overall: 'idle',
    backend: 'memory',
    phases: [],
    fatalError: null,
    ready: false,
  }
}

export function beginBootstrapDiagnostics(backend: string): void {
  snapshot = {
    startedAt: new Date().toISOString(),
    finishedAt: null,
    overall: 'running',
    backend,
    phases: [],
    fatalError: null,
    ready: false,
  }
}

export function recordBootstrapPhase(phase: BootstrapPhaseRecord): void {
  const idx = snapshot.phases.findIndex((p) => p.id === phase.id)
  if (idx >= 0) snapshot.phases[idx] = phase
  else snapshot.phases.push(phase)
}

export function finishBootstrapDiagnostics(opts: {
  ready: boolean
  fatalError?: string | null
}): void {
  const failed = snapshot.phases.filter((p) => p.status === 'failed')
  snapshot.finishedAt = new Date().toISOString()
  snapshot.ready = opts.ready
  snapshot.fatalError = opts.fatalError ?? null
  if (opts.fatalError) snapshot.overall = 'failed'
  else if (failed.length > 0) snapshot.overall = 'degraded'
  else snapshot.overall = 'ready'
}

export function getBootstrapDiagnostics(): BootstrapDiagnosticsSnapshot {
  return {
    ...snapshot,
    phases: snapshot.phases.map((p) => ({ ...p })),
  }
}

/** Run a seed/wire step; on failure isolate and continue when `isolate=true`. */
export function runIsolatedBootstrapPhase(
  id: string,
  label: string,
  fn: () => void | Promise<void>,
  options?: { isolate?: boolean },
): Promise<BootstrapPhaseRecord> {
  const isolate = options?.isolate !== false
  const start = performance.now()
  return Promise.resolve()
    .then(() => fn())
    .then(() => {
      const record: BootstrapPhaseRecord = {
        id,
        label,
        status: 'ok',
        durationMs: Math.round(performance.now() - start),
        error: null,
        isolated: isolate,
      }
      recordBootstrapPhase(record)
      return record
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      const record: BootstrapPhaseRecord = {
        id,
        label,
        status: 'failed',
        durationMs: Math.round(performance.now() - start),
        error: message,
        isolated: isolate,
      }
      recordBootstrapPhase(record)
      if (!isolate) throw err instanceof Error ? err : new Error(message)
      return record
    })
}
