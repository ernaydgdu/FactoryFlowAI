import type { BaseMasterEntity } from '@/domain/master-data/types'
import type { IMasterDataLookupRepository } from '@/domain/ports/persistence/lookups/master-data-lookup.repository'

export class MasterDataLookupInMemoryRepository<T extends BaseMasterEntity>
  implements IMasterDataLookupRepository<T>
{
  private items: T[] = []

  captureSnapshot(): T[] {
    return structuredClone(this.items)
  }

  restoreSnapshot(items: T[]): void {
    this.items = structuredClone(items)
  }

  getAll(_tenantId: string): T[] {
    return this.items.filter((e) => this.isVisible(e))
  }

  getById(_tenantId: string, id: string): T | undefined {
    return this.items.find((e) => e.id === id && this.isVisible(e))
  }

  getByCode(_tenantId: string, code: string): T | undefined {
    return this.items.find((e) => e.code === code && this.isVisible(e))
  }

  getActive(_tenantId: string): T[] {
    return this.items.filter(
      (e) => e.isActive !== false && e.status === 'Active' && !e.deletedAt,
    )
  }

  find(_tenantId: string, predicate: (entity: T) => boolean): T[] {
    return this.items.filter((e) => this.isVisible(e) && predicate(e))
  }

  save(_tenantId: string, entity: T): T {
    const idx = this.items.findIndex((e) => e.id === entity.id)
    if (idx >= 0) this.items[idx] = entity
    else this.items.push(entity)
    return entity
  }

  seedFromLegacy(_tenantId: string, entities: T[]): void {
    this.items = [...entities]
  }

  private isVisible(entity: T): boolean {
    return !entity.deletedAt
  }
}
