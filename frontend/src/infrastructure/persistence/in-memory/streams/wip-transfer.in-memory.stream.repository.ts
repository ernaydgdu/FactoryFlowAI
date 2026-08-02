import type { CursorPage, PageResult, StreamKey } from '@/domain/ports/persistence/persistence.types'
import type { PersistedWipTransfer } from '@/domain/ports/persistence/persistence-aggregates'
import type { IWipTransferStreamRepository } from '@/domain/ports/persistence/streams/wip-transfer-stream.repository'
import type { WipTransfer } from '@/domain/execution-platform/execution-types'

import { paginate } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

export class WipTransferInMemoryStreamRepository implements IWipTransferStreamRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  append(tenantId: string, streamKey: StreamKey, events: PersistedWipTransfer[]): void {
    for (const event of events) {
      this.stores.wipTransferCounter += 1
      this.stores.wipTransfers.push({
        ...event,
        tenantId,
        streamType: streamKey.streamType,
        streamId: streamKey.streamId,
        sequence: this.stores.wipTransferCounter,
      })
    }
  }

  stream(tenantId: string, streamKey: StreamKey, fromSequence: number): PersistedWipTransfer[] {
    return this.stores.wipTransfers.filter(
      (e) =>
        e.tenantId === tenantId &&
        e.streamType === streamKey.streamType &&
        e.streamId === streamKey.streamId &&
        e.sequence >= fromSequence,
    )
  }

  cursor(tenantId: string, filter: Record<string, unknown>, page: CursorPage): PageResult<PersistedWipTransfer> {
    let items = this.stores.wipTransfers.filter((e) => e.tenantId === tenantId)
    const productionOrderNo = filter.productionOrderNo as string | undefined
    if (productionOrderNo) items = items.filter((e) => e.productionOrderNo === productionOrderNo)
    return paginate(items, page)
  }

  latest(tenantId: string, streamKey: StreamKey, count: number): PersistedWipTransfer[] {
    return this.stream(tenantId, streamKey, 0).slice(-count)
  }

  exists(_tenantId: string, eventId: string): boolean {
    return this.stores.wipTransfers.some((e) => e.id === eventId)
  }

  cursorByProductionOrderNo(
    tenantId: string,
    productionOrderNo: string,
    page: CursorPage,
  ): PageResult<PersistedWipTransfer> {
    return this.cursor(tenantId, { productionOrderNo }, page)
  }

  seedFromLegacyEntries(entries: WipTransfer[]): void {
    this.stores.wipTransfers = entries.map((e, i) => ({
      ...e,
      tenantId: 'kepler-default',
      streamType: 'wip_transfer',
      streamId: e.productionOrderNo,
      sequence: i + 1,
    }))
    this.stores.wipTransferCounter = entries.length
  }
}
