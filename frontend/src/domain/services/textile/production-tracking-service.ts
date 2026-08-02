/**
 * Production Tracking — operasyon bazlı ilerleme, OEE, verim.
 */
import type { SalesOrder } from '../../types'
import type { OperationProgress, ProductionTrackingSnapshot } from '../../types/textile-erp'
import { operationRepository, productionLineRepository, workshopRepository } from '../../master-data'

export function buildProductionTracking(order: SalesOrder): ProductionTrackingSnapshot {
  const ops = operationRepository.getActive().slice(0, 6)
  const planned = order.production.plannedQty
  const produced = order.production.producedQty
  const waste = order.production.wasteQty
  const missing = Math.max(0, planned - produced - waste)
  const progress = planned > 0 ? Math.round((produced / planned) * 100) : 0

  const operations: OperationProgress[] = ops.map((op, i) => {
    const opProgress = Math.min(100, Math.max(0, progress - i * 12))
    const completed = Math.floor((opProgress / 100) * planned)
    const line = productionLineRepository.getActive()[i]
    const workshop = line ? workshopRepository.getById(line.workshopId) : undefined

    return {
      operationId: op.id,
      operationCode: op.code,
      operationName: op.name,
      sequence: op.sequence,
      plannedQty: planned,
      completedQty: completed,
      wasteQty: i === ops.length - 2 ? waste : 0,
      reworkQty: order.production.reworkQty,
      secondQualityQty: order.production.secondQualityQty,
      repairQty: 0,
      progressPercent: opProgress,
      lineId: line?.id,
      workshopCode: workshop?.code ?? '',
    }
  })

  const capacityUtil = workshopRepository.getActive().reduce(
    (s, w) => s + w.currentLoad / w.monthlyCapacity,
    0,
  ) / Math.max(1, workshopRepository.getActive().length)

  const efficiency = planned > 0 ? Math.round((produced / (produced + waste + missing)) * 100) : 0
  const oee = Math.round(efficiency * (1 - capacityUtil * 0.2))

  return {
    productionOrderId: order.production.workOrderNo,
    productionOrderNo: order.production.workOrderNo,
    orderId: order.id,
    plannedQty: planned,
    producedQty: produced,
    wasteQty: waste,
    missingQty: missing,
    reworkQty: order.production.reworkQty,
    secondQualityQty: order.production.secondQualityQty,
    repairQty: 0,
    progressPercent: progress,
    operations,
    oee,
    efficiency,
    capacityUtilization: Math.round(capacityUtil * 100),
  }
}

export function getOperationBottleneck(snapshot: ProductionTrackingSnapshot): OperationProgress | undefined {
  return snapshot.operations
    .filter((o) => o.progressPercent < 100)
    .sort((a, b) => a.progressPercent - b.progressPercent)[0]
}
