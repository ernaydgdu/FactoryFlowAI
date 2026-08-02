import type { CursorPage, PageResult, StreamKey } from '@/domain/ports/persistence/persistence.types'
import type { PersistedQualityGateEvaluation } from '@/domain/ports/persistence/persistence-aggregates'
import type { IQualityGateEvaluationStreamRepository } from '@/domain/ports/persistence/streams/quality-gate-evaluation-stream.repository'
import type { QualityGateEvaluation } from '@/domain/execution-platform/execution-types'

import { paginate } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

export class QualityGateEvaluationInMemoryStreamRepository implements IQualityGateEvaluationStreamRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  append(tenantId: string, streamKey: StreamKey, events: PersistedQualityGateEvaluation[]): void {
    for (const event of events) {
      this.stores.qualityGateCounter += 1
      this.stores.qualityGateEvaluations.push({
        ...event,
        tenantId,
        streamType: streamKey.streamType,
        streamId: streamKey.streamId,
        sequence: this.stores.qualityGateCounter,
      })
    }
  }

  stream(tenantId: string, streamKey: StreamKey, fromSequence: number): PersistedQualityGateEvaluation[] {
    return this.stores.qualityGateEvaluations.filter(
      (e) =>
        e.tenantId === tenantId &&
        e.streamType === streamKey.streamType &&
        e.streamId === streamKey.streamId &&
        e.sequence >= fromSequence,
    )
  }

  cursor(tenantId: string, filter: Record<string, unknown>, page: CursorPage): PageResult<PersistedQualityGateEvaluation> {
    let items = this.stores.qualityGateEvaluations.filter((e) => e.tenantId === tenantId)
    const productionOrderNo = filter.productionOrderNo as string | undefined
    if (productionOrderNo) items = items.filter((e) => e.productionOrderNo === productionOrderNo)
    return paginate(items, page)
  }

  latest(tenantId: string, streamKey: StreamKey, count: number): PersistedQualityGateEvaluation[] {
    return this.stream(tenantId, streamKey, 0).slice(-count)
  }

  exists(_tenantId: string, eventId: string): boolean {
    return this.stores.qualityGateEvaluations.some((e) => e.id === eventId)
  }

  latestByBundleAndOperation(
    tenantId: string,
    bundleId: string,
    operationCode: string,
  ): PersistedQualityGateEvaluation | null {
    const items = this.stores.qualityGateEvaluations
      .filter((g) => g.tenantId === tenantId && g.bundleId === bundleId && g.operationCode === operationCode)
      .sort((a, b) => b.evaluatedAt.localeCompare(a.evaluatedAt))
    return items[0] ?? null
  }

  listByProductionOrder(tenantId: string, productionOrderNo: string): PersistedQualityGateEvaluation[] {
    return this.stores.qualityGateEvaluations.filter(
      (g) => g.tenantId === tenantId && g.productionOrderNo === productionOrderNo,
    )
  }

  latestByProductionOrderGate(
    tenantId: string,
    productionOrderNo: string,
    gateType: string,
    operationCode: string,
  ): PersistedQualityGateEvaluation | null {
    const items = this.stores.qualityGateEvaluations
      .filter(
        (g) =>
          g.tenantId === tenantId &&
          g.productionOrderNo === productionOrderNo &&
          g.gateType === gateType &&
          g.operationCode === operationCode,
      )
      .sort((a, b) => b.evaluatedAt.localeCompare(a.evaluatedAt))
    return items[0] ?? null
  }

  seedFromLegacyEntries(entries: QualityGateEvaluation[]): void {
    this.stores.qualityGateEvaluations = entries.map((e, i) => ({
      ...e,
      tenantId: 'kepler-default',
      streamType: 'quality_gate',
      streamId: e.productionOrderNo,
      sequence: i + 1,
    }))
    this.stores.qualityGateCounter = entries.length
  }

  nextGateId(): string {
    this.stores.qualityGateCounter += 1
    return `qg-${this.stores.qualityGateCounter}`
  }
}
