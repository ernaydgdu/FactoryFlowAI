import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { BaseMasterEntity, ValidationResult } from './types'
import type { MasterDataRepository } from './repository'
import type { IMasterDataLookupRepository } from '@/domain/ports/persistence/lookups/master-data-lookup.repository'

/** Port-backed MasterDataRepository — domain servisleri için geriye dönük uyumluluk katmanı */
export function createPortBackedRepository<T extends BaseMasterEntity>(
  getPort: () => IMasterDataLookupRepository<T>,
  validator: (entity: Partial<T>) => ValidationResult,
): MasterDataRepository<T> {
  let cachedAll: T[] | null = null
  let cachedActive: T[] | null = null

  const invalidate = () => {
    cachedAll = null
    cachedActive = null
  }

  return {
    getAll: () => {
      if (cachedAll) return cachedAll
      cachedAll = Object.freeze([...getPort().getAll(DEFAULT_TENANT_ID)]) as T[]
      return cachedAll
    },
    getById: (id) => getPort().getById(DEFAULT_TENANT_ID, id),
    getByCode: (code) => getPort().getByCode(DEFAULT_TENANT_ID, code),
    getActive: () => {
      if (cachedActive) return cachedActive
      cachedActive = Object.freeze([...getPort().getActive(DEFAULT_TENANT_ID)]) as T[]
      return cachedActive
    },
    validate: validator,
    find: (predicate) => getPort().find(DEFAULT_TENANT_ID, predicate),
    _invalidateCache: invalidate,
  } as MasterDataRepository<T> & { _invalidateCache?: () => void }
}

export function masterDataLookups() {
  return requireUnitOfWork().masterDataLookups
}

export function masterDataEnterpriseConfig() {
  return requireUnitOfWork().masterDataEnterpriseConfig
}

export function masterDataChanges() {
  return requireUnitOfWork().masterDataChanges
}

export function masterDataApprovals() {
  return requireUnitOfWork().masterDataApprovals
}

export function masterDataBrainChanges() {
  return requireUnitOfWork().masterDataBrainChanges
}
