import type {
  CostCenter,
  FinancialPeriod,
  GLAccountMapping,
  ProfitCenter,
} from '@/domain/finance-integration/finance-integration.types'
import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { PersistedAccountingIntegration } from '@/domain/ports/persistence/persistence-aggregates'
import type { IAccountingIntegrationRepository } from '@/domain/ports/persistence/aggregates/accounting-integration.repository'

import { conflictError, paginate } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

const DEFAULT_MAPPINGS: GLAccountMapping[] = [
  { id: 'glm-pc-d', sourceEventType: 'ProductionComplete', role: 'debit', glAccountCode: '1400', glAccountName: 'Finished Goods', active: true },
  { id: 'glm-pc-c', sourceEventType: 'ProductionComplete', role: 'credit', glAccountCode: '1500', glAccountName: 'WIP Inventory', active: true },
  { id: 'glm-fg-d', sourceEventType: 'FinishedGoodsReceipt', role: 'debit', glAccountCode: '1400', glAccountName: 'Finished Goods', active: true },
  { id: 'glm-fg-c', sourceEventType: 'FinishedGoodsReceipt', role: 'credit', glAccountCode: '1500', glAccountName: 'WIP Inventory', active: true },
  { id: 'glm-sd-d', sourceEventType: 'ShipmentDeparted', role: 'debit', glAccountCode: '5000', glAccountName: 'COGS', active: true },
  { id: 'glm-sd-c', sourceEventType: 'ShipmentDeparted', role: 'credit', glAccountCode: '1400', glAccountName: 'Finished Goods', active: true },
  { id: 'glm-ci-d', sourceEventType: 'CommercialInvoiceIssued', role: 'debit', glAccountCode: '1200', glAccountName: 'Accounts Receivable', active: true },
  { id: 'glm-ci-c', sourceEventType: 'CommercialInvoiceIssued', role: 'credit', glAccountCode: '4000', glAccountName: 'Revenue', active: true },
  { id: 'glm-pr-d', sourceEventType: 'PurchaseReceipt', role: 'debit', glAccountCode: '1300', glAccountName: 'Raw Material Inventory', active: true },
  { id: 'glm-pr-c', sourceEventType: 'PurchaseReceipt', role: 'credit', glAccountCode: '2100', glAccountName: 'GR/IR Clearing', active: true },
  { id: 'glm-pi-d', sourceEventType: 'PurchaseInvoice', role: 'debit', glAccountCode: '2100', glAccountName: 'GR/IR Clearing', active: true },
  { id: 'glm-pi-c', sourceEventType: 'PurchaseInvoice', role: 'credit', glAccountCode: '2000', glAccountName: 'Accounts Payable', active: true },
  { id: 'glm-ia-d', sourceEventType: 'InventoryAdjustment', role: 'debit', glAccountCode: '1300', glAccountName: 'Inventory', active: true },
  { id: 'glm-ia-c', sourceEventType: 'InventoryAdjustment', role: 'credit', glAccountCode: '5100', glAccountName: 'Inventory Adjustment', active: true },
  { id: 'glm-cc-d', sourceEventType: 'CostClosing', role: 'debit', glAccountCode: '5000', glAccountName: 'COGS', active: true },
  { id: 'glm-cc-c', sourceEventType: 'CostClosing', role: 'credit', glAccountCode: '5200', glAccountName: 'Cost Variance', active: true },
]

const DEFAULT_PERIODS: FinancialPeriod[] = [
  {
    code: '2026-08',
    label: 'August 2026',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    status: 'Open',
  },
  {
    code: '2026-07',
    label: 'July 2026',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    status: 'Closed',
  },
]

const DEFAULT_CC: CostCenter[] = [
  { code: 'CC-PROD', name: 'Production', active: true },
  { code: 'CC-WH', name: 'Warehouse', active: true },
]

const DEFAULT_PC: ProfitCenter[] = [
  { code: 'PC-EXPORT', name: 'Export', active: true },
  { code: 'PC-DOM', name: 'Domestic', active: true },
]

export class AccountingIntegrationInMemoryRepository implements IAccountingIntegrationRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  ensureCatalogSeeded(_tenantId: string): void {
    if (this.stores.accountingGlMappings.length === 0) {
      this.stores.accountingGlMappings = DEFAULT_MAPPINGS.map((m) => ({ ...m }))
    }
    if (this.stores.accountingFinancialPeriods.length === 0) {
      this.stores.accountingFinancialPeriods = DEFAULT_PERIODS.map((p) => ({ ...p }))
    }
    if (this.stores.accountingCostCenters.length === 0) {
      this.stores.accountingCostCenters = DEFAULT_CC.map((c) => ({ ...c }))
    }
    if (this.stores.accountingProfitCenters.length === 0) {
      this.stores.accountingProfitCenters = DEFAULT_PC.map((c) => ({ ...c }))
    }
  }

  findById(tenantId: string, id: string): PersistedAccountingIntegration | null {
    return (
      this.stores.accountingIntegrations.find(
        (e) => e.tenantId === tenantId && e.id === id && !e.deletedAt,
      ) ?? null
    )
  }

  findByIdForUpdate(tenantId: string, id: string): PersistedAccountingIntegration | null {
    return this.findById(tenantId, id)
  }

  findByCode(tenantId: string, code: string): PersistedAccountingIntegration | null {
    return this.findByBatchNo(tenantId, code)
  }

  findByBatchNo(tenantId: string, batchNo: string): PersistedAccountingIntegration | null {
    return (
      this.stores.accountingIntegrations.find(
        (e) => e.tenantId === tenantId && e.batchNo === batchNo && !e.deletedAt,
      ) ?? null
    )
  }

  findByIdempotencyKey(
    tenantId: string,
    idempotencyKey: string,
  ): PersistedAccountingIntegration | null {
    return (
      this.stores.accountingIntegrations.find(
        (e) => e.tenantId === tenantId && e.idempotencyKey === idempotencyKey && !e.deletedAt,
      ) ?? null
    )
  }

  findBySourceEvent(
    tenantId: string,
    sourceEventType: string,
    sourceReferenceId: string,
  ): PersistedAccountingIntegration | null {
    return (
      this.stores.accountingIntegrations.find(
        (e) =>
          e.tenantId === tenantId &&
          e.sourceEventType === sourceEventType &&
          e.sourceReferenceId === sourceReferenceId &&
          e.status !== 'Reversed' &&
          !e.reverseOfBatchId &&
          !e.deletedAt,
      ) ?? null
    )
  }

  nextBatchCounter(): number {
    this.stores.accountingIntegrationCounter += 1
    return this.stores.accountingIntegrationCounter
  }

  listGlMappings(tenantId: string): GLAccountMapping[] {
    this.ensureCatalogSeeded(tenantId)
    return this.stores.accountingGlMappings.map((m) => ({ ...m }))
  }

  upsertGlMapping(tenantId: string, mapping: GLAccountMapping): GLAccountMapping {
    this.ensureCatalogSeeded(tenantId)
    const idx = this.stores.accountingGlMappings.findIndex(
      (m) => m.sourceEventType === mapping.sourceEventType && m.role === mapping.role,
    )
    if (idx >= 0) this.stores.accountingGlMappings[idx] = { ...mapping }
    else this.stores.accountingGlMappings.push({ ...mapping })
    return { ...mapping }
  }

  listFinancialPeriods(tenantId: string): FinancialPeriod[] {
    this.ensureCatalogSeeded(tenantId)
    return this.stores.accountingFinancialPeriods.map((p) => ({ ...p }))
  }

  upsertFinancialPeriod(tenantId: string, period: FinancialPeriod): FinancialPeriod {
    this.ensureCatalogSeeded(tenantId)
    const idx = this.stores.accountingFinancialPeriods.findIndex((p) => p.code === period.code)
    if (idx >= 0) this.stores.accountingFinancialPeriods[idx] = { ...period }
    else this.stores.accountingFinancialPeriods.push({ ...period })
    return { ...period }
  }

  listCostCenters(tenantId: string): CostCenter[] {
    this.ensureCatalogSeeded(tenantId)
    return this.stores.accountingCostCenters.map((c) => ({ ...c }))
  }

  listProfitCenters(tenantId: string): ProfitCenter[] {
    this.ensureCatalogSeeded(tenantId)
    return this.stores.accountingProfitCenters.map((c) => ({ ...c }))
  }

  save(
    tenantId: string,
    aggregate: PersistedAccountingIntegration,
    options?: { expectedVersion?: number },
  ): PersistedAccountingIntegration {
    const idx = this.stores.accountingIntegrations.findIndex(
      (e) => e.tenantId === tenantId && e.id === aggregate.id,
    )
    if (options?.expectedVersion != null && idx >= 0) {
      const current = this.stores.accountingIntegrations[idx]!
      if (current.version !== options.expectedVersion) {
        throw conflictError(
          'AccountingIntegration',
          aggregate.id,
          options.expectedVersion,
          current.version,
        )
      }
    }
    const now = new Date().toISOString()
    const next: PersistedAccountingIntegration = {
      ...aggregate,
      tenantId,
      version: idx >= 0 ? this.stores.accountingIntegrations[idx]!.version + 1 : 1,
      updatedAt: now,
      createdAt: idx >= 0 ? this.stores.accountingIntegrations[idx]!.createdAt : aggregate.createdAt,
    }
    if (idx >= 0) this.stores.accountingIntegrations[idx] = next
    else this.stores.accountingIntegrations.push(next)
    return next
  }

  delete(tenantId: string, id: string): void {
    const idx = this.stores.accountingIntegrations.findIndex(
      (e) => e.tenantId === tenantId && e.id === id,
    )
    if (idx >= 0) {
      this.stores.accountingIntegrations[idx] = {
        ...this.stores.accountingIntegrations[idx]!,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  exists(tenantId: string, id: string): boolean {
    return this.stores.accountingIntegrations.some(
      (e) => e.tenantId === tenantId && e.id === id && !e.deletedAt,
    )
  }

  version(tenantId: string, id: string): number {
    return this.findById(tenantId, id)?.version ?? 0
  }

  cursor(
    tenantId: string,
    filter: Record<string, unknown>,
    page: CursorPage,
  ): PageResult<PersistedAccountingIntegration> {
    let rows = this.stores.accountingIntegrations.filter(
      (e) => e.tenantId === tenantId && !e.deletedAt,
    )
    const status = filter.status
    if (typeof status === 'string') {
      rows = rows.filter((e) => e.status === status)
    }
    rows = rows.sort((a, b) => b.batchNo.localeCompare(a.batchNo))
    return paginate(rows, page)
  }
}
