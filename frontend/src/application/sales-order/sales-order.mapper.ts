import { queryAllSalesOrders, querySalesOrderById, querySalesOrderVersion } from '@/domain/sales-order/sales-order-query.service'
import { isSalesOrderEditable, isSalesOrderReadOnly } from '@/domain/sales-order/sales-order-lifecycle.types'
import { queryProductCardById } from '@/domain/product-card/product-card-crud.service'
import { toListOrder } from '@/domain/data/orders'

import type { SalesOrderDetailDto, SalesOrderKpisDto, SalesOrderListItemDto } from './sales-order.dto'
import { salesOrderLifecycleBadge, salesOrderStatusBadge } from './sales-order.dto'

export function mapSalesOrderList(): SalesOrderListItemDto[] {
  return queryAllSalesOrders().map((o) => {
    const product = queryProductCardById(o.productCardId)
    const terminRisk = new Date(o.exfDate) < new Date(Date.now() + 7 * 86400000)
    return {
      id: o.id,
      orderNo: o.orderNo,
      customer: o.general.customer,
      brand: o.general.brand,
      productCode: product?.productCode ?? '—',
      productName: product?.productName ?? '—',
      orderQty: o.matrixTotals.grandTotal,
      exfDate: o.exfDate,
      lifecycleStatus: salesOrderLifecycleBadge(o.status),
      productionStatus: salesOrderStatusBadge(o.productionStatus),
      terminRisk,
      progress: o.progress,
    }
  })
}

export function mapSalesOrderKpis(): SalesOrderKpisDto {
  const orders = queryAllSalesOrders()
  return {
    items: [
      { label: 'Toplam Sipariş', value: String(orders.length), hint: 'Aktif portföy' },
      {
        label: 'Üretimde',
        value: String(orders.filter((o) => o.productionStatus === 'Üretimde').length),
        hint: 'Devam eden',
      },
      {
        label: 'Termin Riski',
        value: String(orders.filter((o) => o.terminRisk).length),
        hint: '7 gün içinde',
      },
      {
        label: 'Tamamlanan',
        value: String(
          orders.filter((o) => o.productionStatus === 'Tamamlandı' || o.productionStatus === 'Sevk Edildi').length,
        ),
        hint: 'Sevk/Tamam',
      },
    ],
  }
}

export function mapSalesOrderDetail(id: string): SalesOrderDetailDto | null {
  const order = querySalesOrderById(id)
  if (!order) return null
  const product = queryProductCardById(order.productCardId)
  return {
    id: order.id,
    orderNo: order.orderNo,
    version: querySalesOrderVersion(id),
    lifecycleStatus: order.status,
    editable: isSalesOrderEditable(order.status),
    readOnly: isSalesOrderReadOnly(order.status),
    general: {
      customer: order.general.customer,
      brand: order.general.brand,
      buyer: order.general.buyer,
      merchandiser: order.general.merchandiser,
      season: order.general.season,
      collection: order.general.collection,
      poNo: order.general.poNo,
      orderDate: order.general.orderDate,
      exf: order.general.exf,
      deliveryTerm: order.general.deliveryTerm,
      paymentTerm: order.general.paymentTerm,
      currency: order.general.currency,
      notes: order.general.notes,
    },
    productCardId: order.productCardId,
    productCode: product?.productCode ?? '—',
    productName: product?.productName ?? '—',
    sizeSetId: order.sizeSetId,
    unitPrice: order.unitPrice,
    lineDeliveryDate: order.lineDeliveryDate,
    matrixTotals: { grandTotal: order.matrixTotals.grandTotal },
    mrpLineCount: order.mrp.lines.length,
    revisionNo: order.currentRevision.revisionNo,
  }
}

export function mapListOrdersForTable() {
  return queryAllSalesOrders().map(toListOrder)
}
