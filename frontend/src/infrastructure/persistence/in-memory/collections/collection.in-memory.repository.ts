import type { ICollectionRepository } from '@/domain/ports/persistence/collections/collection-repository.base'

export class CollectionInMemoryRepository<T extends { id: string }> implements ICollectionRepository<T> {
  private items: T[] = []
  private counter = 0

  captureSnapshot(): { items: T[]; counter: number } {
    return { items: structuredClone(this.items), counter: this.counter }
  }

  restoreSnapshot(state: { items: T[]; counter: number }): void {
    this.items = structuredClone(state.items)
    this.counter = state.counter
  }

  findAll(_tenantId: string): T[] {
    return [...this.items]
  }

  findById(_tenantId: string, id: string): T | null {
    return this.items.find((e) => e.id === id) ?? null
  }

  save(_tenantId: string, entity: T): T {
    const idx = this.items.findIndex((e) => e.id === entity.id)
    if (idx >= 0) this.items[idx] = entity
    else this.items.push(entity)
    return entity
  }

  remove(_tenantId: string, id: string): boolean {
    const idx = this.items.findIndex((e) => e.id === id)
    if (idx === -1) return false
    this.items.splice(idx, 1)
    return true
  }

  find(_tenantId: string, predicate: (entity: T) => boolean): T[] {
    return this.items.filter(predicate)
  }

  seedFromLegacy(_tenantId: string, entities: T[]): void {
    this.items = [...entities]
  }

  nextCounter(_tenantId: string): number {
    this.counter += 1
    return this.counter
  }

  setCounter(_tenantId: string, value: number): void {
    this.counter = value
  }
}
