/**
 * Enterprise observability composition — infrastructure + domain (application layer).
 * Keeps domain free of infrastructure imports (TD-P0-06).
 */
import {
  queryAuditDashboard,
  queryEnterpriseAiKpis,
  queryOutboxPendingApprox,
  queryReliabilityAudit,
} from '@/domain/enterprise-hardening/enterprise-hardening-query.service'
import { getBootstrapDiagnostics } from '@/infrastructure/persistence/bootstrap-diagnostics'
import { getPersistenceBackend } from '@/infrastructure/persistence/persistence-backend'
import { getPostgresCutoverReport } from '@/infrastructure/persistence/postgresql/postgres-cutover-readiness'
import { getPerformanceSummary, getSlowestServices } from '@/performance/performance-monitor'

export type EnterpriseHealthReport = {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  backend: string
  bootstrap: ReturnType<typeof getBootstrapDiagnostics>
  postgres: ReturnType<typeof getPostgresCutoverReport>
  outboxPending: number
  checks: Array<{ id: string; ok: boolean; detail: string }>
}

export function queryEnterpriseHealth(): EnterpriseHealthReport {
  const bootstrap = getBootstrapDiagnostics()
  const postgres = getPostgresCutoverReport()
  const outboxPending = queryOutboxPendingApprox()

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
    !bootstrap.ready || failed > 1
      ? 'unhealthy'
      : failed === 1 || bootstrap.overall === 'degraded'
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
  return {
    summary: getPerformanceSummary(),
    slowest: getSlowestServices(10),
  }
}

export function queryEnterpriseHardeningDashboard() {
  const health = queryEnterpriseHealth()
  const performance = queryPerformanceDashboard()
  const reliability = queryReliabilityAudit()
  const { twinCompletenessScore, ai } = queryEnterpriseAiKpis()
  return {
    kpis: [
      { label: 'Health', value: health.overall },
      { label: 'Backend', value: health.backend },
      { label: 'Bootstrap', value: health.bootstrap.overall },
      { label: 'PG blocked', value: String(health.postgres.cutoverBlocked) },
      { label: 'Twin score', value: String(twinCompletenessScore) },
      { label: 'Metrics', value: String(performance.summary.totalMetrics) },
    ],
    health,
    performance,
    reliability,
    ai,
  }
}

export { queryAuditDashboard, queryReliabilityAudit }
