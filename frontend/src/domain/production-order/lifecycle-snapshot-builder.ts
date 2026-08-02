import type {
  ProductCardCommandContext,
  SalesOrderCommandContext,
  StockCardCommandContext,
} from '../catalog/command-context.types'
import type { SalesOrder } from '../types'
import { productionLineRepository, workshopRepository } from '../master-data'
import { runPlanningEngineForOrder } from '../services/planning-engine'
import { calculateDetailedCost } from '../services/planning/cost-engine'
import { calculateTerminPlan } from '../services/planning/termin-engine'
import { buildProductionTracking } from '../services/textile/production-tracking-service'
import type { ProductionOrderSnapshot } from './lifecycle-types'

export function buildSnapshotsFromContext(
  order: SalesOrderCommandContext,
  product: ProductCardCommandContext,
  stockCardsById: Map<string, StockCardCommandContext>,
  revision: number,
): ProductionOrderSnapshot {
  const salesOrder = order as unknown as SalesOrder
  const planning = runPlanningEngineForOrder(salesOrder)
  const cost = calculateDetailedCost(salesOrder)
  const termin = calculateTerminPlan(salesOrder)
  const tracking = buildProductionTracking(salesOrder)
  const workshop = workshopRepository.getByCode(
    tracking.operations[0]?.workshopCode ?? workshopRepository.getActive()[0]?.code ?? '',
  )
  const line = productionLineRepository.getById(
    tracking.operations[0]?.lineId ?? productionLineRepository.getActive()[0]?.id ?? '',
  )

  return {
    capturedAt: new Date().toISOString(),
    revision,
    bom: product.bom.map((b) => {
      const sc = stockCardsById.get(b.stockCardId)
      return {
        stockCardId: b.stockCardId,
        code: sc?.code ?? b.stockCardId,
        name: sc?.name ?? '—',
        consumption: b.actualConsumption,
        unit: sc?.unit ?? 'ad',
      }
    }),
    operationRoute: tracking.operations.map((op, i) => ({
      sequence: i + 1,
      code: op.operationCode,
      name: op.operationName,
      workshopCode: op.workshopCode,
    })),
    cost: {
      fabric: cost.fabric,
      accessory: cost.accessory,
      labor: cost.labor,
      overhead: cost.overhead,
      total: cost.totalCost,
      currency: order.general.currency,
    },
    planning: {
      terminRiskScore: planning.risk.score,
      capacityUtilization: workshop
        ? Math.round((workshop.currentLoad / workshop.monthlyCapacity) * 100)
        : 0,
      plannedStart: termin.milestones.find((m) => m.stage === 'SEWING')?.plannedDate ?? order.exfDate,
      plannedFinish: termin.milestones.find((m) => m.stage === 'SHIPPING')?.plannedDate ?? order.exfDate,
      workshopCode: workshop?.code ?? '—',
      lineCode: line?.code ?? '—',
    },
  }
}
