import type { ProductionCalendarSlot } from '@/domain/execution-platform/execution-types'
import type { IProductionCalendarReadModel } from '@/domain/ports/persistence/read-models/production-calendar.read-model'

export class ProductionCalendarInMemoryReadModel implements IProductionCalendarReadModel {
  private slots: ProductionCalendarSlot[] = []
  private counter = 0

  captureSnapshot(): { slots: ProductionCalendarSlot[]; counter: number } {
    return { slots: structuredClone(this.slots), counter: this.counter }
  }

  restoreSnapshot(state: { slots: ProductionCalendarSlot[]; counter: number }): void {
    this.slots = structuredClone(state.slots)
    this.counter = state.counter
  }

  getByProductionOrder(_tenantId: string, productionOrderNo: string): ProductionCalendarSlot[] {
    return this.slots.filter((c) => c.productionOrderNo === productionOrderNo)
  }

  getAll(_tenantId: string): ProductionCalendarSlot[] {
    return [...this.slots]
  }

  append(_tenantId: string, newSlots: ProductionCalendarSlot[]): void {
    this.slots.push(...newSlots)
  }

  nextId(_tenantId: string): string {
    this.counter += 1
    return `pcal-${String(this.counter).padStart(6, '0')}`
  }

  seedFromLegacy(_tenantId: string, slots: ProductionCalendarSlot[]): void {
    this.slots = [...slots]
    this.counter = slots.length
  }
}

export const productionCalendarInMemory = new ProductionCalendarInMemoryReadModel()
