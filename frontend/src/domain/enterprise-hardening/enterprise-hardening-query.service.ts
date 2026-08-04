/**
 * Enterprise hardening observability queries — health, bootstrap, performance, audit, reliability.
 */
import { getBootstrapDiagnostics } from '@/infrastructure/persistence/bootstrap-diagnostics'
import { getPostgresCutoverReport } from '@/infrastructure/persistence/postgresql/postgres-cutover-readiness'
import { getPersistenceBackend } from '@/infrastructure/persistence/persistence-backend'
import { getPerformanceSummary, getSlowestServices } from '@/performance/performance-monitor'
import { getAllAuditLogs } from '@/domain/platform/services/audit-service'
import { queryEnterpriseAiFoundation } from '@/domain/brain/enterprise-ai-foundation'
import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'

export type EnterpriseHealthReport = {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  backend: string
  bootstrap: ReturnType<typeof getBootstrapDiagnostics>
  postgres: ReturnType<typeof getPostgresCutoverReport>
  outboxPending: number
  checks: Array<{ id: string; ok: boolean; detail: string }>
}

export type ReliabilityAuditReport = {
  optimisticLocking: string
  transactionBoundary: string
  idempotency: string
  recovery: string
  notes: string[]
}

export function queryEnterpriseHealth(): EnterpriseHealthReport {
  const bootstrap = getBootstrapDiagnostics()
  const postgres = getPostgresCutoverReport()
  let outboxPending = 0
  try {
    const page = requireUnitOfWork().outbox.cursor(DEFAULT_TENANT_ID, { status: 'Pending' }, {
      limit: 100,
    })
    outboxPending = page.items.length
  } catch {
    outboxPending = -1
  }

  const checks = [
    {
      id: 'bootstrap-ready',
      ok: bootstrap.ready,
      detail: `overall=${bootstrap.overall}`,
    },
    {
      id: 'memory-default',
      ok: getPersistenceBackend() === 'memory',
      detail: `backend=${getPersistenceBackend()}`,
    },
    {
      id: 'postgres-cutover-guarded',
      ok: postgres.cutoverBlocked || postgres.memoryModeSafe,
      detail: postgres.summary,
    },
    {
      id: 'outbox',
      ok: outboxPending >= 0,
      detail: outboxPending < 0 ? 'outbox unavailable' : `pending≈${outboxPending}`,
    },
  ]
  const failed = checks.filter((c) => !c.ok).length
  const overall =
    !bootstrap.ready || failed > 1 ? 'unhealthy' : failed === 1 || bootstrap.overall === 'degraded'
      ? 'degraded'
      : 'healthy'

  return {
    overall,
    backend: getPersistenceBackend(),
    bootstrap,
    postgres,
    outboxPending,
    checks,
  }
}

export function queryBootstrapDiagnosticsDashboard() {
  return getBootstrapDiagnostics()
}

export function queryPerformanceDashboard() {
  const summary = getPerformanceSummary()
  return {
    summary,
    slowest: getSlowestServices(10),
  }
}

export function queryAuditDashboard() {
  const logs = getAllAuditLogs()
    .slice()
    .sort((a, b) => b.changedAt.localeCompare(a.changedAt))
    .slice(0, 100)
  return {
    totalShown: logs.length,
    logs,
  }
}

export function queryReliabilityAudit(): ReliabilityAuditReport {
  return {
    optimisticLocking:
      'Coded aggregates use expectedVersion on save (conflictError on mismatch) — Export/Finance/Cost/Style/Product Card paths.',
    transactionBoundary:
      'All writes via runCommandInTransaction / runPermittedWriteCommand → UnitOfWork TX + outbox flush.',
    idempotency:
      'Command idempotencyKey on Finance/Cost/Style/Export/Shipment aggregates; bootstrap seed idempotent.',
    recovery:
      'BootstrapSafe recovers minimal UoW+runtime after fatal seed isolation; diagnostics retained for operator retry.',
    notes: [
      'Closed Cost/Style aggregates immutable',
      'Postgres factory throws NotReady — memory default preserved',
      'Write permissions asserted inside command path for product-card + production-order + finance modules',
    ],
  }
}

export function queryEnterpriseHardeningDashboard() {
  const health = queryEnterpriseHealth()
  const performance = queryPerformanceDashboard()
  const reliability = queryReliabilityAudit()
  const ai = queryEnterpriseAiFoundation()
  return {
    kpis: [
      { label: 'Health', value: health.overall },
      { label: 'Backend', value: health.backend },
      { label: 'Bootstrap', value: health.bootstrap.overall },
      { label: 'PG blocked', value: String(health.postgres.cutoverBlocked) },
      { label: 'Twin score', value: String(ai.twinCompletenessScore) },
      { label: 'Metrics', value: String(performance.summary.totalMetrics) },
    ],
    health,
    performance,
    reliability,
    ai,
  }
}
