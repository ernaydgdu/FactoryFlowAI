/** AR — MrpRun aggregate port */
import type { CursorPage, PageResult } from '../persistence.types'
import type { PersistedMrpRun } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export interface IMrpRunRepository extends ICodedAggregateRepository<PersistedMrpRun> {
  findByRunNo(tenantId: string, runNo: string): PersistedMrpRun | null
  cursorLatest(tenantId: string, page: CursorPage): PageResult<PersistedMrpRun>
}
