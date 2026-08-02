/**
 * Lifecycle bootstrap seed — domain/data yalnızca bootstrap path'te.
 * Command path bu modülü kullanmaz.
 */
import { SALES_ORDERS } from '../data/orders'
import { getProductById } from '../data/products'
import { getStockCardById } from '../data/stock-cards'
import type { SalesOrder } from '../types'
import { productionLineRepository, workshopRepository } from '../master-data'
import { buildProductionTracking } from '../services/textile/production-tracking-service'
import { syncAllActiveProductionOrders } from '../execution-platform/execution-provisioning'
import { DEFAULT_TENANT_ID, requireUnitOfWork } from '../ports/persistence/persistence-registry'
import type { ProductionOrderLifecycleRecord, ProductionOrderLifecycleStatus } from './lifecycle-types'
import { buildSnapshotsFromContext } from './lifecycle-snapshot-builder'
import { saveLifecycleRecord } from './lifecycle-persistence'

function productionOrderRepo() {
  return requireUnitOfWork().productionOrders
}

export function seedFromSalesOrders(): void {
  const existing = productionOrderRepo().cursor(DEFAULT_TENANT_ID, {}, { limit: 1 })
  if (existing.items.length > 0) return
  for (const order of SALES_ORDERS) {
    if (order.productionStatus === 'Beklemede' && order.production.producedQty === 0) continue
    seedSingleOrder(order)
  }
  syncAllActiveProductionOrders('system')
}

function seedSingleOrder(order: SalesOrder): void {
  const tracking = buildProductionTracking(order)
  const workshop = workshopRepository.getByCode(
    tracking.operations[0]?.workshopCode ?? workshopRepository.getActive()[0]?.code ?? '',
  )
  const line = productionLineRepository.getById(
    tracking.operations[0]?.lineId ?? productionLineRepository.getActive()[0]?.id ?? '',
  )
  const product = getProductById(order.productCardId)!
  const status = mapLegacyStatus(order.productionStatus, order.production.status)
  const stockMap = new Map(
    product.bom.map((b) => {
      const sc = getStockCardById(b.stockCardId)
      return [
        b.stockCardId,
        {
          id: b.stockCardId,
          code: sc?.code ?? b.stockCardId,
          name: sc?.name ?? '—',
          unit: sc?.unit ?? 'ad',
          warehouseCode: sc?.warehouseCode,
        },
      ] as const
    }),
  )
  const record: ProductionOrderLifecycleRecord = {
    id: order.production.workOrderNo,
    productionOrderNo: order.production.workOrderNo,
    salesOrderId: order.id,
    salesOrderNo: order.orderNo,
    productCardId: order.productCardId,
    productCode: product.productCode,
    productName: product.productName,
    customer: order.general.customer,
    buyer: product.buyer,
    workshopId: workshop?.id ?? '',
    workshopCode: workshop?.code ?? '—',
    workshopName: workshop?.name ?? '—',
    productionLineId: line?.id ?? '',
    productionLineCode: line?.code ?? '—',
    productionLineName: line?.name ?? '—',
    plannedQty: order.production.plannedQty,
    producedQty: order.production.producedQty,
    rejectQty: Math.floor(order.production.wasteQty * 0.3),
    reworkQty: order.production.reworkQty,
    secondQualityQty: order.production.secondQualityQty,
    fireQty: order.production.wasteQty,
    startDate: status === 'In Production' || status === 'Completed' || status === 'Closed' ? order.exfDate : null,
    plannedFinish: order.exfDate,
    actualFinish: status === 'Completed' || status === 'Closed' ? order.exfDate : null,
    status,
    priority: order.terminRisk ? 'High' : 'Normal',
    revision: 1,
    snapshots: buildSnapshotsFromContext(
      {
        id: order.id,
        orderNo: order.orderNo,
        productCardId: order.productCardId,
        general: order.general,
        matrix: order.matrix,
        matrixTotals: order.matrixTotals,
        production: order.production,
        exfDate: order.exfDate,
        terminRisk: order.terminRisk,
      },
      {
        id: product.id,
        productCode: product.productCode,
        productName: product.productName,
        buyer: product.buyer,
        bom: product.bom,
      },
      stockMap,
      1,
    ),
    reservationApplied: order.production.bomReserved,
    finishedGoodsReady: status === 'Completed' || status === 'Closed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  saveLifecycleRecord(record)
}

export function mapLegacyStatus(
  productionStatus: string,
  linkStatus: string,
): ProductionOrderLifecycleStatus {
  if (productionStatus === 'Beklemede') return 'Draft'
  if (linkStatus === 'Tamamlandı' && productionStatus === 'Tamamlandı') return 'Completed'
  if (productionStatus === 'Sevk Edildi') return 'Closed'
  if (linkStatus === 'Devam Ediyor') return 'In Production'
  if (linkStatus === 'Planlandı') return 'Released'
  return 'Planned'
}
