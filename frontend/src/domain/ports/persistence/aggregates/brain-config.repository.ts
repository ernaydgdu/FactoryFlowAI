/** AR — BrainConfiguration aggregate port */
import type { PersistedBrainConfig } from '../persistence-aggregates'
import type { IAggregateRepository } from '../repository.base'

export interface IBrainConfigRepository extends IAggregateRepository<PersistedBrainConfig> {
  findByCompanyId(tenantId: string, companyId: string): PersistedBrainConfig | null
}
