import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { PersistedStyleClosing } from '@/domain/ports/persistence/persistence-aggregates'

import type { StyleClosing, StyleClosingBrainReadModel } from './style-closing.types'

function toDomain(row: PersistedStyleClosing): StyleClosing {
  const { tenantId: _t, version: _v, schemaVersion: _s, deletedAt: _d, ...rest } = row
  return rest
}

export function queryAllStyleClosings(): StyleClosing[] {
  const page = requireUnitOfWork().styleClosings.cursor(DEFAULT_TENANT_ID, {}, { limit: 500 })
  return page.items.map(toDomain)
}

export function queryStyleClosingById(id: string): StyleClosing | null {
  const row = requireUnitOfWork().styleClosings.findById(DEFAULT_TENANT_ID, id)
  return row ? toDomain(row) : null
}

export function queryStyleClosingHistory(): StyleClosing[] {
  return queryAllStyleClosings().filter((s) => s.status === 'Closed')
}

export function queryStyleClosingDashboard() {
  const all = queryAllStyleClosings()
  return {
    total: all.length,
    open: all.filter((s) => s.status === 'Open').length,
    checking: all.filter((s) => s.status === 'Checking').length,
    ready: all.filter((s) => s.status === 'Ready').length,
    approved: all.filter((s) => s.status === 'Approved').length,
    closed: all.filter((s) => s.status === 'Closed').length,
    avgMargin:
      all.length === 0
        ? 0
        : Math.round(
            all.reduce((s, c) => s + (c.finalMargin?.marginPercent ?? 0), 0) / all.length,
          ),
  }
}

export function queryStyleClosingBrainReadModel(): StyleClosingBrainReadModel {
  const all = queryAllStyleClosings()
  const avgAnomalyScore =
    all.length === 0
      ? 0
      : Math.round(all.reduce((s, c) => s + c.anomalyScore, 0) / all.length)
  const withMargin = all.filter((c) => c.finalMargin != null)
  const avgMarginPercent =
    withMargin.length === 0
      ? 0
      : Math.round(
          withMargin.reduce((s, c) => s + (c.finalMargin?.marginPercent ?? 0), 0) /
            withMargin.length,
        )
  return {
    open: all.filter((s) => s.status === 'Open').length,
    checking: all.filter((s) => s.status === 'Checking').length,
    ready: all.filter((s) => s.status === 'Ready').length,
    approved: all.filter((s) => s.status === 'Approved').length,
    closed: all.filter((s) => s.status === 'Closed').length,
    avgAnomalyScore,
    avgMarginPercent,
    styleSummaries: all.slice(0, 20).map((s) => ({
      id: s.id,
      batchNo: s.batchNo,
      productCode: s.productCode,
      status: s.status,
      finalMargin: s.finalMargin?.margin ?? null,
      marginPercent: s.finalMargin?.marginPercent ?? null,
      missingCount: s.missingRequirements.length,
      anomalyScore: s.anomalyScore,
      profitabilityHint: s.profitabilityHint,
    })),
    anomalyEvents: all
      .filter((s) => s.anomalyScore >= 40)
      .slice(0, 20)
      .map((s) => ({
        id: s.id,
        batchNo: s.batchNo,
        productCode: s.productCode,
        score: s.anomalyScore,
        detail: s.profitabilityHint ?? `${s.missingRequirements.length} missing`,
      })),
  }
}
