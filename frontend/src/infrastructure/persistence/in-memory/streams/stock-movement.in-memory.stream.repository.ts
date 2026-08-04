import type { CursorPage, PageResult, StreamKey } from '@/domain/ports/persistence/persistence.types'
import type { PersistedStockMovement } from '@/domain/ports/persistence/persistence-aggregates'
import type { IStockMovementStreamRepository } from '@/domain/ports/persistence/streams/stock-movement-stream.repository'

import { paginate } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

export class StockMovementInMemoryStreamRepository implements IStockMovementStreamRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  append(tenantId: string, streamKey: StreamKey, events: PersistedStockMovement[]): void {
    for (const event of events) {
      this.stores.stockMovementCounter += 1
      this.stores.stockMovements.push({
        ...event,
        tenantId,
        streamType: streamKey.streamType,
        streamId: streamKey.streamId,
        sequence: this.stores.stockMovementCounter,
      })
    }
  }

  stream(tenantId: string, streamKey: StreamKey, fromSequence: number): PersistedStockMovement[] {
    return this.stores.stockMovements.filter(
      (m) =>
        m.tenantId === tenantId &&
        m.streamType === streamKey.streamType &&
        m.streamId === streamKey.streamId &&
        m.sequence >= fromSequence,
    )
  }

  cursor(
    tenantId: string,
    filter: Record<string, unknown>,
    page: CursorPage,
  ): PageResult<PersistedStockMovement> {
    let rows = this.stores.stockMovements.filter((m) => m.tenantId === tenantId)
    const type = filter.type as string | undefined
    const warehouseCode = filter.warehouseCode as string | undefined
    if (type) rows = rows.filter((m) => m.type === type)
    if (warehouseCode) rows = rows.filter((m) => m.warehouseCode === warehouseCode)
    rows = rows.sort((a, b) => b.sequence - a.sequence)
    return paginate(rows, page)
  }

  latest(tenantId: string, streamKey: StreamKey, count: number): PersistedStockMovement[] {
    return this.stream(tenantId, streamKey, 0).slice(-count)
  }

  exists(_tenantId: string, eventId: string): boolean {
    return this.stores.stockMovements.some((m) => m.id === eventId)
  }

  cursorByLedgerId(
    tenantId: string,
    ledgerId: string,
    page: CursorPage,
  ): PageResult<PersistedStockMovement> {
    return this.cursor(tenantId, { warehouseCode: ledgerId }, page)
  }

  cursorByStockCardId(
    tenantId: string,
    stockCardId: string,
    page: CursorPage,
  ): PageResult<PersistedStockMovement> {
    let rows = this.stores.stockMovements.filter(
      (m) => m.tenantId === tenantId && m.stockCardId === stockCardId,
    )
    rows = rows.sort((a, b) => b.sequence - a.sequence)
    return paginate(rows, page)
  }
}
