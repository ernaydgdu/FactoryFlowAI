import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { PersistedCostClosing } from '@/domain/ports/persistence/persistence-aggregates'

import type { CostClosing, CostClosingBrainReadModel } from './cost-closing.types'

function toDomain(row: PersistedCostClosing): CostClosing {
  const { tenantId: _t, version: _v, schemaVersion: _s, deletedAt: _d, ...rest } = row
  return rest
}

export function queryAllCostClosings(): CostClosing[] {
  const page = requireUnitOfWork().costClosings.cursor(DEFAULT_TENANT_ID, {}, { limit: 500 })
  return page.items.map(toDomain)
}

export function queryCostClosingById(id: string): CostClosing | null {
  const row = requireUnitOfWork().costClosings.findById(DEFAULT_TENANT_ID, id)
  return row ? toDomain(row) : null
}

export function queryCostClosingHistory(): CostClosing[] {
  return queryAllCostClosings().filter((c) => c.status === 'Closed' || c.status === 'Reversed')
}

export function queryCostClosingDashboard() {
  const all = queryAllCostClosings()
  return {
    total: all.length,
    open: all.filter((c) => c.status === 'Open').length,
    calculating: all.filter((c) => c.status === 'Calculating').length,
    reconciling: all.filter((c) => c.status === 'Reconciling').length,
    approved: all.filter((c) => c.status === 'Approved').length,
    closed: all.filter((c) => c.status === 'Closed').length,
    avgVariance:
      all.length === 0
        ? 0
        : Math.round(
            all.reduce((s, c) => s + (c.variances?.totalVariance ?? 0), 0) / all.length,
          ),
  }
}

export function queryCostClosingBrainReadModel(): CostClosingBrainReadModel {
  const all = queryAllCostClosings()
  const avgAnomalyScore =
    all.length === 0
      ? 0
      : Math.round(all.reduce((s, c) => s + c.anomalyScore, 0) / all.length)
  return {
    open: all.filter((c) => c.status === 'Open').length,
    calculating: all.filter((c) => c.status === 'Calculating').length,
    reconciling: all.filter((c) => c.status === 'Reconciling').length,
    approved: all.filter((c) => c.status === 'Approved').length,
    closed: all.filter((c) => c.status === 'Closed').length,
    avgAnomalyScore,
    varianceInsights: all.slice(0, 20).map((c) => ({
      id: c.id,
      batchNo: c.batchNo,
      totalVariance: c.variances?.totalVariance ?? 0,
      profitabilityHint: c.profitabilityHint,
      anomalyScore: c.anomalyScore,
      status: c.status,
    })),
    closingAnomalyEvents: all
      .filter((c) => c.anomalyScore >= 40)
      .slice(0, 20)
      .map((c) => ({
        id: c.id,
        batchNo: c.batchNo,
        score: c.anomalyScore,
        detail: c.profitabilityHint ?? `${c.gates.filter((g) => !g.passed).length} gate fails`,
      })),
  }
}
