import type { PersistedUserAccount } from '@/domain/ports/persistence/persistence-aggregates'
import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { IAggregateRepository } from '../repository.base'

export interface IUserAccountRepository extends IAggregateRepository<PersistedUserAccount> {
  findByEmail(tenantId: string, email: string): PersistedUserAccount | null
  cursorByFactory(
    tenantId: string,
    factoryId: string,
    page: CursorPage,
  ): PageResult<PersistedUserAccount>
}
