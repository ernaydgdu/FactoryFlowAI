import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { PersistedAccountingIntegration } from '@/domain/ports/persistence/persistence-aggregates'

import type {
  AccountingIntegration,
  FinanceIntegrationBrainReadModel,
} from './finance-integration.types'

function toDomain(row: PersistedAccountingIntegration): AccountingIntegration {
  const { tenantId: _t, version: _v, schemaVersion: _s, deletedAt: _d, ...rest } = row
  return rest
}

export function queryAllAccountingIntegrations(): AccountingIntegration[] {
  const page = requireUnitOfWork().accountingIntegrations.cursor(
    DEFAULT_TENANT_ID,
    {},
    { limit: 500 },
  )
  return page.items.map(toDomain)
}

export function queryAccountingIntegrationById(id: string): AccountingIntegration | null {
  const row = requireUnitOfWork().accountingIntegrations.findById(DEFAULT_TENANT_ID, id)
  return row ? toDomain(row) : null
}

export function queryPostingQueue(): AccountingIntegration[] {
  return queryAllAccountingIntegrations().filter((b) => b.status === 'Queued')
}

export function queryFailedPostings(): AccountingIntegration[] {
  return queryAllAccountingIntegrations().filter((b) => b.status === 'Failed')
}

export function queryPostedResults(): AccountingIntegration[] {
  return queryAllAccountingIntegrations().filter(
    (b) => b.status === 'Posted' || b.status === 'Reversed',
  )
}

export function queryGlMappings() {
  return requireUnitOfWork().accountingIntegrations.listGlMappings(DEFAULT_TENANT_ID)
}

export function queryFinancialPeriods() {
  return requireUnitOfWork().accountingIntegrations.listFinancialPeriods(DEFAULT_TENANT_ID)
}

export function queryCostCenters() {
  return requireUnitOfWork().accountingIntegrations.listCostCenters(DEFAULT_TENANT_ID)
}

export function queryProfitCenters() {
  return requireUnitOfWork().accountingIntegrations.listProfitCenters(DEFAULT_TENANT_ID)
}

export function queryFinanceIntegrationDashboard() {
  const all = queryAllAccountingIntegrations()
  return {
    total: all.length,
    queued: all.filter((b) => b.status === 'Queued').length,
    posted: all.filter((b) => b.status === 'Posted').length,
    failed: all.filter((b) => b.status === 'Failed').length,
    reversed: all.filter((b) => b.status === 'Reversed').length,
    openPeriods: queryFinancialPeriods().filter((p) => p.status === 'Open').length,
  }
}

export function queryFinanceIntegrationBrainReadModel(): FinanceIntegrationBrainReadModel {
  const all = queryAllAccountingIntegrations()
  const posted = all.filter((b) => b.status === 'Posted')
  const totalDebitPosted = posted.reduce((s, b) => s + b.journalEntry.debitTotal, 0)
  const totalCreditPosted = posted.reduce((s, b) => s + b.journalEntry.creditTotal, 0)
  const avgCostAnomalyScore =
    all.length === 0
      ? 0
      : Math.round(all.reduce((s, b) => s + b.costAnomalyScore, 0) / all.length)
  return {
    queued: all.filter((b) => b.status === 'Queued').length,
    posted: posted.length,
    failed: all.filter((b) => b.status === 'Failed').length,
    reversed: all.filter((b) => b.status === 'Reversed').length,
    totalDebitPosted,
    totalCreditPosted,
    avgCostAnomalyScore,
    profitabilityInsights: all
      .filter((b) => !!b.profitabilityHint)
      .slice(0, 20)
      .map((b) => ({
        batchId: b.id,
        batchNo: b.batchNo,
        sourceEventType: b.sourceEventType,
        hint: b.profitabilityHint!,
        costAnomalyScore: b.costAnomalyScore,
      })),
    costAnomalyEvents: all
      .filter((b) => b.costAnomalyScore >= 40)
      .slice(0, 20)
      .map((b) => ({
        batchId: b.id,
        batchNo: b.batchNo,
        score: b.costAnomalyScore,
        sourceEventType: b.sourceEventType,
      })),
  }
}
