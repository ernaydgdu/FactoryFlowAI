import type { BaseMasterEntity, ValidationResult } from './types'

export type MasterDataRepository<T extends BaseMasterEntity> = {
  getAll(): T[]
  getById(id: string): T | undefined
  getByCode(code: string): T | undefined
  getActive(): T[]
  validate(entity: Partial<T>): ValidationResult
  find(predicate: (entity: T) => boolean): T[]
}

export function createRepository<T extends BaseMasterEntity>(
  data: T[],
  validator: (entity: Partial<T>) => ValidationResult,
): MasterDataRepository<T> {
  let cachedAll: T[] | null = null
  let cachedActive: T[] | null = null
  let cacheGeneration = 0

  const invalidate = () => {
    cachedAll = null
    cachedActive = null
    cacheGeneration += 1
  }

  return {
    getAll: () => {
      if (cachedAll) return cachedAll
      cachedAll = Object.freeze([...data]) as T[]
      return cachedAll
    },
    getById: (id) => data.find((e) => e.id === id),
    getByCode: (code) => data.find((e) => e.code === code),
    getActive: () => {
      if (cachedActive) return cachedActive
      cachedActive = Object.freeze(
        data.filter((e) => e.isActive !== false && e.status === 'Active' && !e.deletedAt),
      ) as T[]
      return cachedActive
    },
    validate: validator,
    find: (predicate) => data.filter(predicate),
    /** Cache invalidation — entity mutation sonrası */
    _invalidateCache: invalidate,
    _cacheGeneration: () => cacheGeneration,
  } as MasterDataRepository<T> & { _invalidateCache?: () => void; _cacheGeneration?: () => number }
}

export function resolveName<T extends BaseMasterEntity>(
  repo: MasterDataRepository<T>,
  id: string,
): string {
  return repo.getById(id)?.name ?? id
}

export function resolveCode<T extends BaseMasterEntity>(
  repo: MasterDataRepository<T>,
  id: string,
): string {
  return repo.getById(id)?.code ?? id
}

export function requireById<T extends BaseMasterEntity>(
  repo: MasterDataRepository<T>,
  id: string,
): T {
  const entity = repo.getById(id)
  if (!entity) throw new Error(`Master data bulunamadı: ${id}`)
  return entity
}

export function requireByCode<T extends BaseMasterEntity>(
  repo: MasterDataRepository<T>,
  code: string,
): T {
  const entity = repo.getByCode(code)
  if (!entity) throw new Error(`Master data bulunamadı: ${code}`)
  return entity
}
