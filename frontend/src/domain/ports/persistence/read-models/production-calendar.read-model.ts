/** Production Calendar read model port */
import type { ProductionCalendarSlot } from '@/domain/execution-platform/execution-types'

export interface IProductionCalendarReadModel {
  getByProductionOrder(tenantId: string, productionOrderNo: string): ProductionCalendarSlot[]
  getAll(tenantId: string): ProductionCalendarSlot[]
  append(tenantId: string, slots: ProductionCalendarSlot[]): void
  nextId(tenantId: string): string
  seedFromLegacy(tenantId: string, slots: ProductionCalendarSlot[]): void
}
