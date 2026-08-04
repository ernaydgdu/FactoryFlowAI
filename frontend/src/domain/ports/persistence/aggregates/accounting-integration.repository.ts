/** AR — AccountingIntegration (finance posting batch) port. */
import type {
  CostCenter,
  FinancialPeriod,
  GLAccountMapping,
  ProfitCenter,
} from '../../../finance-integration/finance-integration.types'
import type { PersistedAccountingIntegration } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export interface IAccountingIntegrationRepository
  extends ICodedAggregateRepository<PersistedAccountingIntegration> {
  findByBatchNo(tenantId: string, batchNo: string): PersistedAccountingIntegration | null
  findByIdempotencyKey(
    tenantId: string,
    idempotencyKey: string,
  ): PersistedAccountingIntegration | null
  findBySourceEvent(
    tenantId: string,
    sourceEventType: string,
    sourceReferenceId: string,
  ): PersistedAccountingIntegration | null
  nextBatchCounter(): number
  listGlMappings(tenantId: string): GLAccountMapping[]
  upsertGlMapping(tenantId: string, mapping: GLAccountMapping): GLAccountMapping
  listFinancialPeriods(tenantId: string): FinancialPeriod[]
  upsertFinancialPeriod(tenantId: string, period: FinancialPeriod): FinancialPeriod
  listCostCenters(tenantId: string): CostCenter[]
  listProfitCenters(tenantId: string): ProfitCenter[]
  ensureCatalogSeeded(tenantId: string): void
}
