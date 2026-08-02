import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { WipPositionReadModel } from '@/domain/ports/persistence/persistence-aggregates'
import type { IWipPositionReadModel } from '@/domain/ports/persistence/read-models/wip-position.read-model'
import type { WipPosition } from '@/domain/execution-platform/execution-types'

import { paginate } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

export class WipPositionInMemoryReadModel implements IWipPositionReadModel {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  get(tenantId: string, key: string): WipPositionReadModel | null {
    return this.stores.wipPositionModels.find((m) => m.tenantId === tenantId && m.key === key) ?? null
  }

  refresh(_tenantId: string, _sourceKey: string): void {}

  cursor(tenantId: string, _filter: Record<string, unknown>, page: CursorPage): PageResult<WipPositionReadModel> {
    const items = this.stores.wipPositionModels.filter((m) => m.tenantId === tenantId)
    return paginate(items, page)
  }

  refreshByProductionOrderNo(_tenantId: string, _productionOrderNo: string): void {}

  refreshGlobal(_tenantId: string): void {}

  setPositions(tenantId: string, positions: WipPosition[]): void {
    const byPo = new Map<string, WipPosition[]>()
    for (const pos of positions) {
      const list = byPo.get(pos.productionOrderNo) ?? []
      list.push(pos)
      byPo.set(pos.productionOrderNo, list)
    }
    const now = new Date().toISOString()
    for (const [poNo, poPositions] of byPo) {
      const key = poNo
      const idx = this.stores.wipPositionModels.findIndex((m) => m.tenantId === tenantId && m.key === key)
      const model: WipPositionReadModel = {
        key,
        tenantId,
        productionOrderNo: poNo,
        positions: poPositions,
        refreshedAt: now,
      }
      if (idx >= 0) this.stores.wipPositionModels[idx] = model
      else this.stores.wipPositionModels.push(model)
    }
    const globalKey = '__global__'
    const globalIdx = this.stores.wipPositionModels.findIndex((m) => m.tenantId === tenantId && m.key === globalKey)
    const globalModel: WipPositionReadModel = {
      key: globalKey,
      tenantId,
      productionOrderNo: null,
      positions,
      refreshedAt: now,
    }
    if (globalIdx >= 0) this.stores.wipPositionModels[globalIdx] = globalModel
    else this.stores.wipPositionModels.push(globalModel)
  }

  getPositions(tenantId: string, productionOrderNo: string): WipPosition[] {
    return this.get(tenantId, productionOrderNo)?.positions ?? []
  }

  getAllPositions(tenantId: string): WipPosition[] {
    return this.get(tenantId, '__global__')?.positions ?? []
  }

  clearAll(tenantId: string): void {
    this.stores.wipPositionModels = this.stores.wipPositionModels.filter((m) => m.tenantId !== tenantId)
  }
}
