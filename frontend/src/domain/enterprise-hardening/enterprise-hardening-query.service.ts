/**
 * Enterprise hardening domain queries — audit + reliability (no infrastructure imports).
 */
import { getAllAuditLogs } from '@/domain/platform/services/audit-service'
import { queryEnterpriseAiFoundation } from '@/domain/brain/enterprise-ai-foundation'
import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'

export type ReliabilityAuditReport = {
  optimisticLocking: string
  transactionBoundary: string
  idempotency: string
  recovery: string
  notes: string[]
}

export function queryOutboxPendingApprox(): number {
  try {
    const page = requireUnitOfWork().outbox.cursor(DEFAULT_TENANT_ID, { status: 'Pending' }, {
      limit: 100,
    })
    return page.items.length
  } catch {
    return -1
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
      'Repo-level expectedVersion supported widely; production-order + stock-ledger command paths must pass expectedVersion (P0 remediation). Remaining gaps: execution/GR (P1).',
    transactionBoundary:
      'Writes via runCommandInTransaction / runPermittedWriteCommand → UnitOfWork TX + outbox flush.',
    idempotency:
      'Strong on packaging/shipment/export/finance/cost/style/barcode; weak on sales/PO/stock/MD/MRP.',
    recovery:
      'BootstrapSafe isolates seed failures; critical uow-factory/wire-runtime fail-closed; providers never return null.',
    notes: [
      'Closed Cost/Style aggregates immutable',
      'Postgres factory throws NotReady — memory default preserved',
      'Command-path write guards: product-card, production-order lifecycle, packaging, shipment, commercial, export, finance, cost/style closing — not all modules',
      'Domain layer must not import infrastructure (observability composed in application)',
    ],
  }
}

export function queryEnterpriseAiKpis() {
  const ai = queryEnterpriseAiFoundation()
  return {
    twinCompletenessScore: ai.twinCompletenessScore,
    ai,
  }
}
