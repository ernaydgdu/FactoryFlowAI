import type { CursorPage, PageResult, StreamKey } from '@/domain/ports/persistence/persistence.types'
import type { PersistedOperationWorkSession } from '@/domain/ports/persistence/persistence-aggregates'
import type { IOperationWorkSessionStreamRepository } from '@/domain/ports/persistence/streams/operation-work-session-stream.repository'
import type { OperationWorkSession } from '@/domain/execution-platform/execution-types'

import { paginate } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

export class OperationWorkSessionInMemoryStreamRepository implements IOperationWorkSessionStreamRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  append(tenantId: string, streamKey: StreamKey, events: PersistedOperationWorkSession[]): void {
    for (const event of events) {
      this.stores.workSessionCounter += 1
      this.stores.workSessions.push({
        ...event,
        tenantId,
        streamType: streamKey.streamType,
        streamId: streamKey.streamId,
        sequence: this.stores.workSessionCounter,
      })
    }
  }

  stream(tenantId: string, streamKey: StreamKey, fromSequence: number): PersistedOperationWorkSession[] {
    return this.stores.workSessions.filter(
      (e) =>
        e.tenantId === tenantId &&
        e.streamType === streamKey.streamType &&
        e.streamId === streamKey.streamId &&
        e.sequence >= fromSequence,
    )
  }

  cursor(tenantId: string, filter: Record<string, unknown>, page: CursorPage): PageResult<PersistedOperationWorkSession> {
    let items = this.stores.workSessions.filter((e) => e.tenantId === tenantId)
    const bundleId = filter.bundleId as string | undefined
    if (bundleId) items = items.filter((e) => e.bundleIds.includes(bundleId))
    return paginate(items, page)
  }

  latest(tenantId: string, streamKey: StreamKey, count: number): PersistedOperationWorkSession[] {
    return this.stream(tenantId, streamKey, 0).slice(-count)
  }

  exists(_tenantId: string, eventId: string): boolean {
    return this.stores.workSessions.some((e) => e.id === eventId)
  }

  findActiveByOperation(
    tenantId: string,
    productionOrderNo: string,
    operationCode: string,
  ): PersistedOperationWorkSession | null {
    return (
      this.listByProductionOrder(tenantId, productionOrderNo, operationCode).find(
        (s) => s.status === 'InProgress' || s.status === 'Paused',
      ) ?? null
    )
  }

  cursorByBundleId(tenantId: string, bundleId: string, page: CursorPage): PageResult<PersistedOperationWorkSession> {
    return this.cursor(tenantId, { bundleId }, page)
  }

  listByProductionOrder(
    tenantId: string,
    productionOrderNo: string,
    operationCode?: string,
  ): PersistedOperationWorkSession[] {
    let items = this.stores.workSessions.filter(
      (s) => s.tenantId === tenantId && s.productionOrderNo === productionOrderNo,
    )
    if (operationCode) items = items.filter((s) => s.operationCode === operationCode)
    return items
  }

  seedFromLegacyEntries(entries: OperationWorkSession[]): void {
    this.stores.workSessions = entries.map((e, i) => ({
      ...e,
      tenantId: 'kepler-default',
      streamType: 'work_session',
      streamId: `${e.productionOrderNo}:${e.operationCode}`,
      sequence: i + 1,
    }))
    this.stores.workSessionCounter = entries.length
  }

  nextSessionId(): string {
    this.stores.workSessionCounter += 1
    return `ows-${String(this.stores.workSessionCounter).padStart(6, '0')}`
  }

  updateSession(tenantId: string, session: OperationWorkSession): void {
    const idx = this.stores.workSessions.findIndex((s) => s.tenantId === tenantId && s.id === session.id)
    if (idx >= 0) {
      this.stores.workSessions[idx] = { ...this.stores.workSessions[idx]!, ...session }
    }
  }
}
