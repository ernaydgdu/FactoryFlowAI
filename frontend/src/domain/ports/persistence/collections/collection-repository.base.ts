/**
 * Generic entity collection port — collaboration / platform entity'ler için.
 */
export interface ICollectionRepository<T extends { id: string }> {
  findAll(tenantId: string): T[]
  findById(tenantId: string, id: string): T | null
  save(tenantId: string, entity: T): T
  remove(tenantId: string, id: string): boolean
  find(tenantId: string, predicate: (entity: T) => boolean): T[]
  seedFromLegacy(tenantId: string, entities: T[]): void
  nextCounter(tenantId: string): number
  setCounter(tenantId: string, value: number): void
}
