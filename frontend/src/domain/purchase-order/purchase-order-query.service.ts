/** Purchase Order query — legacy adapter for workflows/MRP compatibility */
import { queryAllPurchaseOrders as queryAggregates } from '@/domain/purchasing/purchase-order-query.service'
import type { PurchaseOrderAggregate, PurchaseOrderLifecycleStatus } from '@/domain/purchasing/purchasing.types'
import type { PurchaseOrder } from '@/domain/types/workflows'

function toLegacyStatus(status: PurchaseOrderLifecycleStatus): PurchaseOrder['status'] {
  switch (status) {
    case 'Partially Received':
      return 'Kısmi Teslim'
    case 'Completed':
    case 'Closed':
    case 'Archived':
      return 'Tamamlandı'
    case 'Cancelled':
      return 'Tamamlandı'
    default:
      return 'Açık'
  }
}

function toLegacyPo(agg: PurchaseOrderAggregate): PurchaseOrder {
  const isLate = new Date(agg.termin) < new Date()
  let status = toLegacyStatus(agg.status)
  if (isLate && (agg.status === 'Open' || agg.status === 'Partially Received')) {
    status = 'Gecikmiş'
  }
  return {
    id: agg.id,
    poNo: agg.poNo,
    prId: agg.purchaseRequestId,
    orderId: agg.sourceOrderId,
    orderNo: agg.sourceOrderNo,
    supplier: agg.supplier,
    termin: agg.termin,
    deliveryWarehouse: agg.deliveryWarehouse,
    currency: agg.currency,
    lines: agg.lines.map((l) => ({
      id: l.id,
      materialCode: l.materialCode,
      materialName: l.materialName,
      quantity: l.quantity,
      unit: l.unit,
      unitPrice: l.unitPrice,
      vatRate: l.vatRate,
      lot: l.lot,
      deliveredQty: l.deliveredQty,
      remainingQty: l.remainingQty,
    })),
    status,
    totalAmount: agg.totalAmount,
  }
}

export function queryAllPurchaseOrders(): PurchaseOrder[] {
  return queryAggregates().map(toLegacyPo)
}

export function queryPurchaseOrderByNo(poNo: string): PurchaseOrder | null {
  const agg = queryAggregates().find((p) => p.poNo === poNo)
  return agg ? toLegacyPo(agg) : null
}
